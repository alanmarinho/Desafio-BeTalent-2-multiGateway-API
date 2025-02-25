import Session from '#models/session';

interface IRemoveSession {
  session_id: number;
}

export async function RemoveSession({ session_id }: IRemoveSession) {
  try {
    const session = await Session.findBy({ id: session_id });
    if (session) {
      session.delete();
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}
