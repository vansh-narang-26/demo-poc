"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSnackbar } from "notistack";
import { TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import LoginLogo from "@/assets/images/login-logo.svg";
import ShowPassword from "@/assets/images/show-password.svg";
import { useChat } from "@/store/useChat";

const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: "28px",
    "&.Mui-focused fieldset": {
      borderColor: "#22c55e",
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#22c55e",
  },
});

export default function LoginPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(true);

  const envUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
  const envPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  const autoLoginEnabled = process.env.NEXT_PUBLIC_AUTO_LOGIN === "true";

  useEffect(() => {
    const savedUsername = sessionStorage.getItem("rememberedUsername");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }

    const isRunningInTeams =
      typeof window !== "undefined" &&
      (window.navigator.userAgent.includes("Teams") ||
        window.location !== window.parent.location); 

    if (autoLoginEnabled && envUsername && envPassword && isRunningInTeams) {
      localStorage.setItem("isLoggedIn", "true");
      const chatStore = useChat.getState();
      chatStore.initializeNewSession();
      router.replace("/chat");
    } else {
      setLoading(false);
    }
  }, [autoLoginEnabled, envUsername, envPassword, router]);

  const handleLogin = () => {
    if (username === envUsername && password === envPassword) {
      localStorage.setItem("isLoggedIn", "true");

      if (rememberMe) {
        sessionStorage.setItem("rememberedUsername", username);
      } else {
        sessionStorage.removeItem("rememberedUsername");
      }

      const chatStore = useChat.getState();
      chatStore.initializeNewSession();

      setTimeout(() => {
        enqueueSnackbar("Login successful", { variant: "success" });
        router.push("/chat");
      }, 2000);
    } else {
      enqueueSnackbar("Invalid username or password", { variant: "error" });
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <Image
        src={LoginLogo}
        alt="Platform Logo"
        width={60}
        height={60}
        className="mb-6"
      />
      <h1 className="text-xl font-semibold mb-6">Welcome to CAPEX</h1>

      <div className="w-full max-w-md border-none px-6 py-5">
        <div className="mb-4">
          <StyledTextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            required
            variant="outlined"
          />
        </div>
        <div className="mb-4">
          <StyledTextField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            variant="outlined"
            InputProps={{
              endAdornment: (
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="ml-2 text-gray-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Image
                    src={ShowPassword}
                    alt={showPassword ? "Hide password" : "Show password"}
                    width={20}
                    height={20}
                  />
                </button>
              ),
            }}
          />
        </div>

        <div className="flex items-center mb-4">
          <button
            id="remember"
            type="button"
            role="switch"
            aria-checked={rememberMe}
            onClick={() => setRememberMe(!rememberMe)}
            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors focus:outline-none ${
              rememberMe ? "bg-black" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                rememberMe ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
          <label htmlFor="remember" className="text-sm text-gray-700 ml-3">
            Remember me
          </label>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-black text-white font-medium py-2 rounded-lg mt-5 hover:bg-gray-900 hover:cursor-pointer"
        >
          Login to Platform
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-500 flex gap-2">
        <a href="#" className="hover:underline">
          Terms of Use
        </a>
        <span>|</span>
        <a href="#" className="hover:underline">
          Privacy Policy
        </a>
      </div>
    </div>
  );
}
