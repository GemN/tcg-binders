import type { FC } from "react";

interface NotAuthorizedProps {}

export const NotAuthorized: FC<NotAuthorizedProps> = () => {
  return (
    <div>
      <h1>Not Authorized</h1>
      <p>You do not have permission to access this page.</p>
      <p>Please contact your administrator if you believe this is an error.</p>
    </div>
  );
};
