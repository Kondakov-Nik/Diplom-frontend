import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/home/home";
import Calendar from "../pages/calendar/calendar";
import Personalpage from "../pages/personalpage/personalpage";
//import NotFound from "../pages/notFound/notFound";
import Report from "../pages/report/report";
import s from "./appContainer.module.scss"
import Header from "../layouts/header/headerComponent";
import Footer from "../layouts/footer/footerComponent";
import AuthForm from "../features/authForm";
import Main from "../pages/main/main";

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Header />
      <div className={s.container}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Calendar" element={<Calendar />} />
        <Route path="/Login" element={<AuthForm />} />
        <Route path="/Personalpage" element={<Personalpage/>} />
        <Route path="/Report" element={<Report />} />
        <Route path="/Home" element={<Main />} />
{/*         <Route path="*" element={<NotFound />} />
 */}      </Routes>
      </div>

        <Footer />
    </Router>
  );
};

export default AppRouter;