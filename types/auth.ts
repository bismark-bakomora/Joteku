export type OtpPurpose = 'login' | 'signup' | 'guest';

export type Session = {
  phone: string;
  name?: string;
  email?: string;
  isGuest: boolean;
  signedInAt: string;
};
