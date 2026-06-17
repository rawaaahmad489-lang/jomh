import { useState } from "react";

const VendorCompleteProfile = () => {
  const [form, setForm] = useState({
    storeName: "",
    ownerName: "",
    phone: "",
    address: "",
    description: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // لاحقًا API / Supabase
    console.log("Vendor Profile:", form);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto" }}>
      <h2>Complete Vendor Profile</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="storeName"
          placeholder="Store Name"
          onChange={handleChange}
        />

        <input
          name="ownerName"
          placeholder="Owner Name"
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder="Phone Number"
          onChange={handleChange}
        />

        <input
          name="address"
          placeholder="Business Address"
          onChange={handleChange}
        />

        <textarea
          name="description"
          placeholder="Store Description"
          onChange={handleChange}
        />

        <button type="submit">Save Profile</button>
      </form>
    </div>
  );
};

export default VendorCompleteProfile;