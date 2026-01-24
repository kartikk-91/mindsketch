import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="flex flex-col items-center space-y-4">
          <CardTitle className="text-2xl font-bold ">
            Authenticating...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            🤗
            <p className="text-muted-foreground text-sm">
              Please wait while we log you in.
            </p>
          </div>
          <AuthenticateWithRedirectCallback
            signInFallbackRedirectUrl="/"
            signUpFallbackRedirectUrl="/"
          />
        </CardContent>
      </Card>
    </div>
  );
}
