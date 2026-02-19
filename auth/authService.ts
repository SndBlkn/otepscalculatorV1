import {
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
  ISignUpResult,
} from "amazon-cognito-identity-js";
import userPool from "./cognitoConfig";

export interface SignUpParams {
  email: string;
  password: string;
  givenName: string;
  familyName: string;
  company: string;
  title: string;
}

export interface UserAttributes {
  email: string;
  givenName: string;
  familyName: string;
  company: string;
  title: string;
}

export function signUp(params: SignUpParams): Promise<ISignUpResult> {
  const { email, password, givenName, familyName, company, title } = params;

  const attributeList: CognitoUserAttribute[] = [
    new CognitoUserAttribute({ Name: "email", Value: email }),
    new CognitoUserAttribute({ Name: "given_name", Value: givenName }),
    new CognitoUserAttribute({ Name: "family_name", Value: familyName }),
    new CognitoUserAttribute({ Name: "custom:company", Value: company }),
    new CognitoUserAttribute({ Name: "custom:title", Value: title }),
  ];

  return new Promise((resolve, reject) => {
    userPool.signUp(email, password, attributeList, [], (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result!);
    });
  });
}

export function confirmSignUp(email: string, code: string): Promise<string> {
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

export function signIn(
  email: string,
  password: string
): Promise<CognitoUserSession> {
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
  });

  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => resolve(session),
      onFailure: (err) => reject(err),
    });
  });
}

export function signOut(): void {
  const currentUser = userPool.getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
  }
}

export function getCurrentSession(): Promise<CognitoUserSession | null> {
  const currentUser = userPool.getCurrentUser();
  if (!currentUser) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    currentUser.getSession(
      (err: Error | null, session: CognitoUserSession | null) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(session);
      }
    );
  });
}

export function getIdToken(): Promise<string | null> {
  const currentUser = userPool.getCurrentUser();
  if (!currentUser) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    currentUser.getSession(
      (err: Error | null, session: CognitoUserSession | null) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(session?.getIdToken().getJwtToken() || null);
      }
    );
  });
}

export function getUserAttributes(): Promise<UserAttributes | null> {
  const currentUser = userPool.getCurrentUser();
  if (!currentUser) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    currentUser.getSession((err: Error | null) => {
      if (err) {
        reject(err);
        return;
      }

      currentUser.getUserAttributes((attrErr, attributes) => {
        if (attrErr) {
          reject(attrErr);
          return;
        }

        const attrs: Record<string, string> = {};
        attributes?.forEach((attr) => {
          attrs[attr.getName()] = attr.getValue();
        });

        resolve({
          email: attrs["email"] || "",
          givenName: attrs["given_name"] || "",
          familyName: attrs["family_name"] || "",
          company: attrs["custom:company"] || "",
          title: attrs["custom:title"] || "",
        });
      });
    });
  });
}
