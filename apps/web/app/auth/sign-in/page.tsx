import SignInButton from "@/components/sign-in"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="mt-2 text-gray-600">Please sign in to continue</p>
        </div>
        <div className="mt-8 flex justify-center">
          <SignInButton />
        </div>
      </div>
    </div>
  )
}
