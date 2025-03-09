import AuthGatewayKeyValue, { TypeKeyValue, UsekeyValueIn } from '#models/auth_gateway_key_value';
import { decrypt } from '#utils/auth/encryptAndDecrypt';
import axios, { AxiosHeaders, AxiosRequestConfig } from 'axios';

import env from '#start/env';
import { GatewayConfig } from '../Factory/gatewayFactory.js';
const APP_KEY = env.get('APP_KEY');

export interface IRequestConfigResult {
  header: AxiosHeaders;
  body: Record<string, any>;
  url: string;
}
export interface GatewayLoginReturn {
  key: string;
  value: any;
  use_in: UsekeyValueIn;
}

export interface ITransactionPayload {
  transaction_amount: number;
  client_name: string;
  client_email: string;
  card_number: string;
  card_CVV: string;
}

export class PaymentGateway {
  protected gatewayConfig: GatewayConfig;

  constructor(config: { gatewayConfig: GatewayConfig }) {
    this.gatewayConfig = config.gatewayConfig;
  }

  async requestConfig(
    gateway_id: number,
    endPoint: string,
    bodyData?: Object,
    routerParams?: Record<string, string>,
  ): Promise<IRequestConfigResult | void> {
    try {
      let header: AxiosHeaders = new AxiosHeaders();
      let body: Record<string, any> = {};
      let queryParams: URLSearchParams = new URLSearchParams();
      let gatewayTokens = await AuthGatewayKeyValue.query()
        .where('gateway_id', gateway_id)
        .preload('gateway')
        .preload('config');

      if (gatewayTokens.length < 1) {
        return;
      }

      let avaliableTokens;
      let need_decript = false;

      if (gatewayTokens[0].config.need_login) {
        avaliableTokens = await this.login(gatewayTokens);
      } else {
        avaliableTokens = gatewayTokens.filter((token) => token.type === TypeKeyValue.TOKEN);
        need_decript = true;
      }

      if (avaliableTokens === false) {
        return;
      }

      avaliableTokens.forEach((token) => {
        switch (token.use_in) {
          case UsekeyValueIn.BODY:
            body[token.key] = need_decript ? decrypt({ data: token.value, key: APP_KEY }) : token.value;
            break;
          case UsekeyValueIn.HEADER:
            header[token.key] = need_decript ? decrypt({ data: token.value, key: APP_KEY }) : token.value;
            break;
          case UsekeyValueIn.QUERY:
            queryParams.append(token.key, need_decript ? decrypt({ data: token.value, key: APP_KEY }) : token.value);
            break;
          case UsekeyValueIn.BEARER:
            header.set(
              'Authorization',
              `Bearer ${need_decript ? decrypt({ data: token.value, key: APP_KEY }) : token.value}`,
            );
            break;
          default:
            break;
        }
      });

      if (bodyData) {
        body = { ...body, ...bodyData };
      }
      const url = gatewayTokens[0].gateway.url;
      const port = gatewayTokens[0].gateway.port;
      let requestUrl = `${url}:${port}${endPoint}${queryParams.toString() ? `?${queryParams}` : ''}`;
      if (routerParams && Object.keys(routerParams).length > 0) {
        Object.keys(routerParams).forEach((param) => {
          requestUrl = requestUrl.replace(`:${param}`, routerParams[param]);
        });
      }
      return { body: body, header: header, url: requestUrl };
    } catch (err) {
      return;
    }
  }

  remapData(data: Record<string, any>, mapTo: Record<string, any>, forRequest: boolean): Record<string, any> | false {
    try {
      let newPayload: Record<string, any> = {};
      if (forRequest) {
        for (const [localKey, externalKey] of Object.entries(mapTo)) {
          newPayload[externalKey] = data[localKey as keyof ITransactionPayload];
        }
      } else {
        for (const [localKey, externalKey] of Object.entries(mapTo)) {
          newPayload[localKey] = data[externalKey as keyof ITransactionPayload];
        }
      }

      return newPayload;
    } catch (err) {
      return false;
    }
  }

  async login(tokens: AuthGatewayKeyValue[]): Promise<GatewayLoginReturn[] | false> {
    try {
      let header: AxiosHeaders = new AxiosHeaders();
      let body: Record<string, any> = {};
      let queryParams: URLSearchParams = new URLSearchParams();
      tokens.forEach((token) => {
        switch (token.use_in) {
          case UsekeyValueIn.BODY:
            body[token.key] = decrypt({ data: token.value, key: APP_KEY });
            break;

          case UsekeyValueIn.HEADER:
            header[token.key] = decrypt({ data: token.value, key: APP_KEY });
            break;

          case UsekeyValueIn.QUERY:
            queryParams.append(token.key, decrypt({ data: token.value, key: APP_KEY }));
            break;

          default:
            break;
        }
      });
      const url = tokens[0].gateway.url;
      const port = tokens[0].gateway.port;

      const requestUrl = `${url}:${port}${this.gatewayConfig.methods.login?.endPoint}${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await axios.post(requestUrl, body, { headers: header });
      let tokensReturn: GatewayLoginReturn[] = [];

      for (const [originalKey, newKey] of Object.entries(JSON.parse(tokens[0].config.expected_login_tokens_map))) {
        let tokensObject: GatewayLoginReturn = { key: '', value: '', use_in: UsekeyValueIn.HEADER };
        if (response.data[originalKey] !== undefined) {
          tokensObject['key'] = newKey as string;
          tokensObject['value'] = response.data[originalKey];
          tokensObject['use_in'] = tokens[0].config.tokens_used_in as unknown as UsekeyValueIn;
          tokensReturn.push(tokensObject);
        }
      }

      return tokensReturn;
    } catch (err) {
      const expectedErrors = this.gatewayConfig.methods.login?.expectedError;

      if (expectedErrors) {
        const expectedValues = Object.values(expectedErrors);

        const errString = JSON.stringify(err.response.data);

        if (expectedValues.some((value) => errString.includes(value))) {
          console.error('gateway login', errString);
        }
      }
      return false;
    }
  }

  async listTransactions(gateway_id: number): Promise<Array<Record<string, any>> | false> {
    try {
      const result = await this.requestConfig(gateway_id, this.gatewayConfig.methods.listTransactions.endPoint);
      if (!result) {
        return false;
      }

      const { body, header, url } = result;

      const axiosConfig: AxiosRequestConfig = {
        method: this.gatewayConfig.methods.listTransactions.metod.toLowerCase(),
        url,
        headers: header,
        data: body,
      };
      const gatewayReturn = await axios.request(axiosConfig);
      if (!gatewayReturn) {
        return false;
      }
      const dataRoute = this.gatewayConfig.methods.listTransactions?.dataRoute;

      const data = dataRoute ? (gatewayReturn.data?.[dataRoute] ?? gatewayReturn.data) : gatewayReturn.data;
      const remappedData: Array<Record<string, any>> = data.map((item: Record<string, any>) => {
        let newItem: Record<string, any> = {};

        const expectedDataMap = this.gatewayConfig.methods.listTransactions.expectedDataMap!;
        const result = this.remapData(item, expectedDataMap[0], false);
        if (!!result) {
          newItem = result;
        }

        return newItem;
      });
      return remappedData;
    } catch (err) {
      const expectedErrors = this.gatewayConfig.methods.listTransactions?.expectedError;

      if (expectedErrors) {
        const expectedValues = Object.values(expectedErrors);

        const errString = JSON.stringify(err.response.data);

        if (expectedValues.some((value) => errString.includes(value))) {
          console.error('gateway listTransactions', errString);
        }
      }
      return false;
    }
  }

  async makeTransaction(
    gateway_id: number,
    transactionData: ITransactionPayload,
  ): Promise<false | Record<string, string>> {
    try {
      const expectedDataMap = this.gatewayConfig.methods.transaction.bodyDataMap!;
      const transactionDataRemmaped = this.remapData(transactionData, expectedDataMap, true);
      if (!transactionDataRemmaped) {
        return false;
      }
      const result = await this.requestConfig(
        gateway_id,
        this.gatewayConfig.methods.transaction.endPoint,
        transactionDataRemmaped,
      );
      if (!result) {
        return false;
      }
      const { body, header, url } = result;

      const axiosConfig: AxiosRequestConfig = {
        method: this.gatewayConfig.methods.transaction.metod.toLowerCase(),
        url,
        headers: header,
        data: body,
      };
      const gatewayReturn = await axios.request(axiosConfig);
      if (!gatewayReturn) {
        return false;
      }

      const dataRoute = this.gatewayConfig.methods.transaction?.dataRoute;

      const data = dataRoute ? (gatewayReturn.data?.[dataRoute] ?? gatewayReturn.data) : gatewayReturn.data;
      if (data) {
        for (const expectedKey in this.gatewayConfig.methods.transaction.expectedData) {
          const expectedValue = this.gatewayConfig.methods.transaction.expectedData[expectedKey];
          if (!(expectedValue in data)) {
            return false;
          }
        }
        const expectedData = this.gatewayConfig.methods.transaction.expectedData!;
        const returnPayload = this.remapData(data, expectedData, false);
        return returnPayload;
      }

      return false;
    } catch (err) {
      const expectedErrors = this.gatewayConfig.methods.login?.expectedError;

      if (expectedErrors) {
        const expectedValues = Object.values(expectedErrors);

        const errString = JSON.stringify(err.response.data);

        if (expectedValues.some((value) => errString.includes(value))) {
          console.error('gateway makeTransaction', errString);
        }
      }
      return false;
    }
  }
  async reimbursement(gateway_id: number, trasaction_id: string): Promise<boolean> {
    try {
      const params = this.gatewayConfig.methods.reimbursement.params;

      if (!params) {
        return false;
      }
      let bodyParams: Record<string, string> = {};
      let routeParams: Record<string, string> = {};
      for (const parameter of params) {
        if (parameter.type === 'BODY') {
          bodyParams[parameter.external_id] = trasaction_id;
        }
        if (parameter.type === 'ROUTE') {
          routeParams[parameter.external_id] = trasaction_id;
        }
      }
      const result = await this.requestConfig(
        gateway_id,
        this.gatewayConfig.methods.reimbursement.endPoint,
        Object.keys(bodyParams).length > 0 ? bodyParams : undefined,
        Object.keys(routeParams).length > 0 ? routeParams : undefined,
      );
      if (!result) {
        return false;
      }

      const { body, header, url } = result;

      const axiosConfig: AxiosRequestConfig = {
        method: this.gatewayConfig.methods.reimbursement.metod.toLowerCase(),
        url,
        headers: header,
        data: body,
      };
      const gatewayResponse = await axios.request(axiosConfig);
      const expectedErrorKeys = Object.values(this.gatewayConfig.methods.reimbursement.expectedError);

      const hasError = expectedErrorKeys.some((key) => key in gatewayResponse.data);
      if (hasError || (gatewayResponse.status < 200 && gatewayResponse.status >= 300)) {
        return false;
      }

      return true;
    } catch (err) {
      const expectedErrors = this.gatewayConfig.methods.login?.expectedError;

      if (expectedErrors) {
        const expectedValues = Object.values(expectedErrors);

        const errString = JSON.stringify(err.response.data);

        if (expectedValues.some((value) => errString.includes(value))) {
          console.error('gateway reimbursement', errString);
        }
      }
      return false;
    }
  }
}
