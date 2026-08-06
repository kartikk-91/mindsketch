import { Plus_Jakarta_Sans } from "next/font/google";
import LandingPage from "./landing/page";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export default function HomePage() {
  return (
    <div className={plusJakarta.className}>
      <LandingPage />
    </div>
  );
}
