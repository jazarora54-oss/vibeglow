import { Bodoni_Moda, Cinzel, Cormorant_Garamond, DM_Sans, Fraunces, Inter, Jost, Lato, Lora, Montserrat, Nunito_Sans, Outfit, Playfair_Display, Poppins, Quicksand, Raleway } from "next/font/google";
/** All website fonts (next/font needs every option written out literally, no shared objects). The two original fonts load as before;
 *  the others have preload off, so a visitor's browser only downloads one when the owner picks it in admin -> Brand & Logo.
 *  Which pair is used is decided by FONT_PAIRS in lib/theme.ts. */
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"], variable: "--font-cormorant" });
const jost = Jost({ subsets: ["latin"], variable: "--font-jost" });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false, style: ["normal", "italic"], variable: "--font-playfair" });
const lato = Lato({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "700"], variable: "--font-lato" });
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", preload: false, style: ["normal", "italic"], variable: "--font-fraunces" });
const nunito = Nunito_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-nunito" });
const poppins = Poppins({ subsets: ["latin"], display: "swap", preload: false, weight: ["500", "600", "700"], variable: "--font-poppins" });
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-inter" });
const bodoni = Bodoni_Moda({ subsets: ["latin"], display: "swap", preload: false, style: ["normal", "italic"], variable: "--font-bodoni" });
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-montserrat" });
const cinzel = Cinzel({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-cinzel" });
const raleway = Raleway({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-raleway" });
const outfit = Outfit({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-outfit" });
const dmsans = DM_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-dmsans" });
const lora = Lora({ subsets: ["latin"], display: "swap", preload: false, style: ["normal", "italic"], variable: "--font-lora" });
const quicksand = Quicksand({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-quicksand" });
/** Put this on <html>. */
export const fontClasses = [cormorant, jost, playfair, lato, fraunces, nunito, poppins, inter, bodoni, montserrat, cinzel, raleway, outfit, dmsans, lora, quicksand].map(f => f.variable).join(" ");
