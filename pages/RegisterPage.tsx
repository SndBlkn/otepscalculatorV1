import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const BLOCKED_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "ymail.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "mail.com",
  "gmx.com",
  "tutanota.com",
  "yandex.com",
];

const TITLE_OPTIONS = [
  "C-Level",
  "VP",
  "Director",
  "Senior Manager",
  "Manager",
  "Team Lead",
  "Senior",
  "Mid-Level",
  "Junior",
  "Associate",
  "Intern",
];

const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<"register" | "verify">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, confirmCode } = useAuth();
  const navigate = useNavigate();

  const isBlockedDomain = (emailValue: string): boolean => {
    const domain = emailValue.split("@")[1]?.toLowerCase();
    return domain ? BLOCKED_DOMAINS.includes(domain) : false;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isBlockedDomain(email)) {
      setError(
        "Please use your corporate email address. Public email providers (Gmail, Outlook, etc.) are not allowed."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!title) {
      setError("Please select your title.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        email,
        password,
        givenName,
        familyName,
        company,
        title,
      });
      setStep("verify");
    } catch (err: any) {
      if (err.code === "UsernameExistsException") {
        setError("An account with this email already exists.");
      } else if (err.code === "InvalidPasswordException") {
        setError(
          "Password must contain at least 8 characters, including uppercase, lowercase, and numbers."
        );
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await confirmCode(email, verificationCode);
      navigate("/login", { replace: true });
    } catch (err: any) {
      if (err.code === "CodeMismatchException") {
        setError("Invalid verification code. Please try again.");
      } else if (err.code === "ExpiredCodeException") {
        setError("Verification code has expired. Please request a new one.");
      } else {
        setError(err.message || "Verification failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-ot-900 border border-ot-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ot-accent placeholder-slate-600 text-sm";
  const labelClass = "block text-xs font-bold uppercase text-slate-400 mb-2";

  return (
    <div className="min-h-screen bg-ot-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-ot-accent rounded-lg shadow-lg shadow-ot-accent/20 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === "register" ? "Create Account" : "Verify Email"}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {step === "register"
              ? "Register with your corporate email"
              : `We sent a verification code to ${email}`}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-ot-800 border border-ot-700 rounded-xl p-8 shadow-xl">
          {step === "register" ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input
                    type="text"
                    value={givenName}
                    onChange={(e) => setGivenName(e.target.value)}
                    required
                    placeholder="John"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input
                    type="text"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    required
                    placeholder="Doe"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  placeholder="Your company name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Title</label>
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className={`${inputClass} cursor-pointer ${!title ? "text-slate-600" : ""}`}
                >
                  <option value="" disabled>
                    Select your title
                  </option>
                  {TITLE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Corporate Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className={inputClass}
                />
                {email && isBlockedDomain(email) && (
                  <p className="text-red-400 text-xs mt-1">
                    Public email providers are not allowed. Please use your
                    corporate email.
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min. 8 characters"
                  className={inputClass}
                />
                <p className="text-slate-500 text-xs mt-1">
                  Must contain uppercase, lowercase, and numbers
                </p>
              </div>

              <div>
                <label className={labelClass}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat your password"
                  className={inputClass}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2
                  ${
                    isSubmitting
                      ? "bg-ot-700 text-slate-400 cursor-not-allowed"
                      : "bg-ot-accent hover:bg-sky-400 text-white shadow-lg hover:shadow-ot-accent/25"
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className={labelClass}>Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className={`${inputClass} text-center text-lg font-mono tracking-widest`}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2
                  ${
                    isSubmitting
                      ? "bg-ot-700 text-slate-400 cursor-not-allowed"
                      : "bg-ot-accent hover:bg-sky-400 text-white shadow-lg hover:shadow-ot-accent/25"
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-ot-accent hover:text-sky-300 font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          IEC 62443 / NIST Compatible Sizing Platform
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
