

import { Routes, Route } from "react-router-dom";
import ProtectedRoute  from "../core/guards/ProtectedRoute";
import RoleRoute       from "../core/guards/RoleRoute";

import Home from "../modules/public/Home";
import WhyChooseUs from "../modules/public/Whychooseus";
import LoginPage       from "../modules/auth/pages/LoginPage";
import RegisterPage    from "../modules/auth/pages/Register";
import SelectRole      from "../modules/auth/pages/SelectRole";
import RedirectPage    from "../modules/auth/pages/RedirectPage";
import Unauthorized    from "../modules/auth/pages/Unauthorized";
import WaitingApproval from "../modules/auth/pages/WaitingApproval";
import Rejected        from "../modules/auth/pages/Rejected";

import DoctorModule    from "../modules/doctor/pages/DoctorDashboard";
import MotherModule    from "../modules/mother/pages/MotherDashboard";

import Motherhealthpage from "../modules/mother/pages/Motherhealthpage";


import VendorModule    from "../modules/vendor/pages/VendorDashboard";

import MotherCompleteProfile  from "../modules/mother/pages/CompleteProfile";

import ChildDetailPage from "../modules/mother/pages/ChildDetailPage";

import AdminModule from "../modules/admin/components/AdminModule";
import AdminLogin  from "../modules/admin/pages/AdminLogin";

import StoresPage         from "../modules/vendor/pages/stores/StoresPage";
import StoreDetailPage    from "../modules/vendor/pages/stores/StoreDetailPage";
import CategoriesPage     from "../modules/vendor/pages/stores/CategoriesPage";
import { CartPage }       from "../modules/vendor/pages/stores/CartPage";
import { CheckoutPage }   from "../modules/vendor/pages/stores/CheckoutPage";

import ArticlesPage   from "../modules/mother/pages/ArticlesPage";
import ArticleDetailPage from "../modules/mother/pages/ArticleDetailPage";

import BoutiquePage from "../modules/vendor/pages/stores/BoutiquePage";

import AboutPage from "../modules/public/AboutPage";
import Services   from "../modules/public/Services";
import RecommendationsPage from "../modules/doctor/pages/RecommendationsPage";

import MilestonesPage from "../modules/mother/pages/MilestonesPage";


import Doctorspage from "../modules/public/Doctorspage";
import MotherDoctorsPage from "../modules/mother/pages/MotherDoctorsPage";

import RecommendationPage from "../modules/mother/pages/RecommendationsPage";

import Blocked from "../modules/auth/pages/Blocked";


import ForgotPasswordPage from "../modules/auth/pages/ForgotPasswordPage";
import ResetPasswordPage  from "../modules/auth/pages/ResetPasswordPage";
import AuthCallback       from "../modules/auth/pages/AuthCallback";
export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"                 element={<Home />} />
      <Route path="/why-us"            element={<WhyChooseUs/>} />
      <Route path="/login"            element={<LoginPage />} />
      <Route path="/register"         element={<RegisterPage />} />
      <Route path="/select-role"      element={<SelectRole />} />
      <Route path="/redirect"         element={<RedirectPage />} />
      <Route path="/unauthorized"     element={<Unauthorized />} />
      <Route path="/waiting-approval" element={<WaitingApproval />} />
      <Route path="/rejected"         element={<Rejected />} />
<Route path="/Blocked "         element={<Blocked  />} />

   <Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password"  element={<ResetPasswordPage />} />
<Route path="/auth/callback"   element={<AuthCallback />} />   
<Route path="/services" element={<Services />} />
      <Route path="/about" element={<AboutPage />}
/>
<Route path="/doctors" element={<Doctorspage />} />
      {/* Doctor */}
      <Route path="/doctor/*" element={
        <ProtectedRoute>
          <RoleRoute roles={["doctor"]}>
            <DoctorModule />
          </RoleRoute>
        </ProtectedRoute>
      }/>

  <Route path="/articles"            element={<ArticlesPage />} />
  <Route path="/articles/:id"        element={<ArticleDetailPage />} />

<Route path="/recommendationss" element={<RecommendationsPage />} />

      {/* Mother */}
      <Route path="/mother/*" element={
        <ProtectedRoute>
          <RoleRoute roles={["mother"]}>
            <MotherModule />
          </RoleRoute>
        </ProtectedRoute>
      }/>
<Route
  path="/mother/child/:childId"
  element={<ChildDetailPage />}
/>
<Route path="/mother/doctors" element={
  <ProtectedRoute>
    <RoleRoute roles={["mother"]}>
      <MotherDoctorsPage />
    </RoleRoute>
  </ProtectedRoute>
}/>
<Route path="/mother/health" element={<Motherhealthpage />} />
<Route path="/recommendations" element={< RecommendationPage />} />

      {/* Vendor */}
      <Route path="/vendor/*" element={
        <ProtectedRoute>
          <RoleRoute roles={["vendor"]}>
            <VendorModule />
          </RoleRoute>
        </ProtectedRoute>
      }/>


 
    <Route path="/stores"              element={<StoresPage />} />
    <Route path="/stores/:storeId"     element={<StoreDetailPage />} />
    <Route path="/categories"          element={<CategoriesPage />} />
    <Route path="/categories/:categoryId" element={<CategoriesPage />} />
    <Route path="/cart"                element={<CartPage />} />
    <Route path="/checkout"            element={<CheckoutPage />} />
    <Route path="/boutique" element={<BoutiquePage />} />
 

<Route path="/mother/complete-profile" element={
  <ProtectedRoute>
    <RoleRoute roles={["mother"]}>
      <MotherCompleteProfile />
    </RoleRoute>
  </ProtectedRoute>
}/>
<Route path="/mother/milestones"             element={<MilestonesPage />} />
<Route path="/mother/milestones/:childId"    element={<MilestonesPage />} />


<Route path="/admin/login" element={<AdminLogin />} />

<Route path="/admin/*" element={
  <ProtectedRoute>
    <RoleRoute roles={["admin"]}>
      <AdminModule />   {/* ← بدل <div>Admin Dashboard</div> */}
    </RoleRoute>
  </ProtectedRoute>
}/>





    </Routes>
   
  );
}



