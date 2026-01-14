import "./controllers/route-controller";
import "@fortawesome/fontawesome-free/css/all.css";
import "highlight.js/styles/atom-one-dark.css";
import "@simonwep/pickr/dist/themes/nano.min.css";
import * as Header from "./pages/header";
import * as Footer from "./pages/footer";
import * as Nav from "./pages/nav";

// initialized once
// persists across client-side route changes
Header.init();
Nav.init();
Footer.init();
