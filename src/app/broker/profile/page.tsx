"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  connector_code: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  alternate_phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  bank_name: string | null;
  account_holder_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  branch_name: string | null;
  account_type: string | null;
};

export default function BrokerProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    alternate_phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    bank_name: "",
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    branch_name: "",
    account_type: "",
  });

  async function loadProfile() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(userError.message);

      if (!user) {
        window.location.href = "/broker/login";
        return;
      }

      let currentProfile: Profile | null = null;

      const { data: profileById, error: profileIdError } =
        await supabase
          .from("connector_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

      if (!profileIdError && profileById) {
        currentProfile = profileById as Profile;
      }

      if (!currentProfile && user.email) {
        const { data: profileByEmail } = await supabase
          .from("connector_profiles")
          .select("*")
          .ilike("email", user.email.trim())
          .maybeSingle();

        if (profileByEmail) {
          currentProfile = profileByEmail as Profile;
        }
      }

      if (!currentProfile) {
        currentProfile = {
          id: user.id,
          connector_code: null,
          full_name:
            typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : "",
          email: user.email || null,
          phone: null,
          alternate_phone: null,
          date_of_birth: null,
          gender: null,
          address: null,
          city: null,
          state: null,
          pincode: null,
          bank_name: null,
          account_holder_name: null,
          account_number: null,
          ifsc_code: null,
          branch_name: null,
          account_type: null,
        };
      }

      setProfile(currentProfile);

      setForm({
        full_name: currentProfile.full_name || "",
        email: currentProfile.email || user.email || "",
        phone: currentProfile.phone || "",
        alternate_phone: currentProfile.alternate_phone || "",
        date_of_birth: currentProfile.date_of_birth || "",
        gender: currentProfile.gender || "",
        address: currentProfile.address || "",
        city: currentProfile.city || "",
        state: currentProfile.state || "",
        pincode: currentProfile.pincode || "",
        bank_name: currentProfile.bank_name || "",
        account_holder_name:
          currentProfile.account_holder_name || "",
        account_number: currentProfile.account_number || "",
        ifsc_code: currentProfile.ifsc_code || "",
        branch_name: currentProfile.branch_name || "",
        account_type: currentProfile.account_type || "",
      });
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load profile."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setSuccessMessage("");
    setErrorMessage("");
  }

  async function handleSave() {
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(userError.message);

      if (!user) {
        window.location.href = "/broker/login";
        return;
      }

      if (!form.full_name.trim()) {
        throw new Error("Please enter your full name.");
      }

      if (!form.email.trim()) {
        throw new Error("Please enter your email.");
      }

      if (
        form.phone.trim() &&
        !/^[0-9+\-\s()]{7,20}$/.test(form.phone.trim())
      ) {
        throw new Error("Please enter a valid phone number.");
      }

      if (
        form.pincode.trim() &&
        !/^[0-9]{6}$/.test(form.pincode.trim())
      ) {
        throw new Error("Pincode must be 6 digits.");
      }

      if (
        form.ifsc_code.trim() &&
        !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(
          form.ifsc_code.trim().toUpperCase()
        )
      ) {
        throw new Error("Please enter a valid IFSC code.");
      }

      const updateData = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        alternate_phone:
          form.alternate_phone.trim() || null,
        date_of_birth:
          form.date_of_birth || null,
        gender: form.gender || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        pincode: form.pincode.trim() || null,
        bank_name: form.bank_name.trim() || null,
        account_holder_name:
          form.account_holder_name.trim() || null,
        account_number:
          form.account_number.trim() || null,
        ifsc_code:
          form.ifsc_code.trim().toUpperCase() || null,
        branch_name:
          form.branch_name.trim() || null,
        account_type:
          form.account_type || null,
      };

      const { data: updatedProfile, error: updateError } =
        await supabase
          .from("connector_profiles")
          .update(updateData)
          .eq("id", user.id)
          .select("*")
          .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      const savedProfile = updatedProfile as Profile;
      setProfile(savedProfile);

      // Keep Supabase Auth metadata synchronized with connector_profiles.
      // The dashboard can therefore show the new name immediately without
      // requiring the connector to logout/login again.
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: savedProfile.full_name || form.full_name.trim(),
        },
      });

      if (authUpdateError) {
        console.warn("Auth metadata sync failed:", authUpdateError);
      }

      // Persist the exact saved identity for the dashboard and other
      // connector pages. This is only a UI/session bridge; Supabase remains
      // the source of truth.
      try {
        localStorage.setItem(
          "loankarts-broker-identity",
          JSON.stringify({
            profileId: savedProfile.id,
            brokerName: savedProfile.full_name || form.full_name.trim(),
            brokerEmail: savedProfile.email || form.email.trim(),
            connectorCode: savedProfile.connector_code || "",
            savedAt: Date.now(),
          })
        );

        localStorage.setItem(
          "loankarts-broker-profile-cache",
          JSON.stringify({
            profile: savedProfile,
            savedAt: Date.now(),
          })
        );
      } catch (storageError) {
        console.warn("Unable to persist profile cache:", storageError);
      }

      // Notify any already-mounted connector UI in the same browser.
      window.dispatchEvent(
        new CustomEvent("loankarts:profile-updated", {
          detail: savedProfile,
        })
      );

      setSuccessMessage(
        "Your profile has been updated successfully."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const displayName =
    form.full_name || "Connector Partner";

  const initial =
    displayName.charAt(0).toUpperCase() || "C";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f8fb]">
        <header className="bg-[#050b20] shadow-lg">
          <div className="mx-auto flex max-w-[1280px] items-center px-5 py-4 sm:px-8">
            <img
              src="/logo-white.png"
              alt="LoanKarts"
              className="h-[42px] w-[150px] object-contain"
            />
          </div>
        </header>

        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-[#08b8d4]" />

            <p className="mt-4 text-sm font-bold text-slate-500">
              Loading your profile...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f7fa]">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="sticky top-0 z-50 bg-[#050b20] text-white shadow-[0_8px_30px_rgba(5,11,32,0.15)]">

        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3.5 sm:px-8 lg:px-10">

          <a
            href="/broker"
            className="flex items-center gap-4"
          >
            <img
              src="/logo-white.png"
              alt="LoanKarts"
              className="h-[40px] w-[145px] object-contain"
            />

            <div className="hidden border-l border-white/15 pl-4 md:block">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#08b8d4]">
                Partner Portal
              </p>

              <p className="mt-0.5 text-[11px] text-white/45">
                LoanKarts Connector Dashboard
              </p>
            </div>
          </a>

          <div className="flex items-center gap-3">

            {profile?.connector_code && (
              <div className="hidden rounded-xl border border-[#08b8d4]/40 bg-[#08b8d4]/10 px-4 py-2 sm:block">
                <span className="mr-2 text-[8px] font-black uppercase tracking-[0.15em] text-white/40">
                  CONNECTOR ID
                </span>

                <span className="text-xs font-black text-[#08b8d4]">
                  {profile.connector_code}
                </span>
              </div>
            )}

            <button
              onClick={logout}
              className="rounded-xl border border-white/15 bg-white/[0.04] px-5 py-2.5 text-xs font-black transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200"
            >
              Logout
            </button>
          </div>

        </div>
      </header>


      {/* =====================================================
          CONTENT
          ===================================================== */}

      <section className="mx-auto w-full max-w-[1280px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">

        {/* BACK */}

        <a
          href="/broker"
          className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-[#08aeca]"
        >
          ← Back to Dashboard
        </a>


        {/* TITLE */}

        <div className="mt-6">

          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#08b8d4]">
                ACCOUNT SETTINGS
              </p>

              <h1 className="mt-1.5 text-3xl font-black tracking-tight text-[#062536] sm:text-[34px]">
                My Profile
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
                Manage your personal information, address and commission payout details.
              </p>
            </div>

            <div className="hidden rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm md:block">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                PROFILE STATUS
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-green-500" />
                </span>

                <span className="text-xs font-black text-green-600">
                  Active
                </span>
              </div>
            </div>

          </div>

        </div>


        {/* =====================================================
            ALERTS
            ===================================================== */}

        {successMessage && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 font-black text-green-600">
              ✓
            </div>

            <div>
              <p className="text-sm font-black text-green-700">
                Profile Updated
              </p>

              <p className="mt-0.5 text-xs text-green-600">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 font-black text-red-600">
              !
            </div>

            <div>
              <p className="text-sm font-black text-red-700">
                Unable to Save
              </p>

              <p className="mt-0.5 text-xs text-red-600">
                {errorMessage}
              </p>
            </div>
          </div>
        )}


        {/* =====================================================
            PROFILE HERO
            ===================================================== */}

        <div className="relative mt-6 overflow-hidden rounded-[28px] bg-[#062536] shadow-[0_18px_45px_rgba(6,37,54,0.16)]">

          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#08b8d4]/10" />

          <div className="absolute -bottom-32 left-1/2 h-64 w-64 rounded-full bg-[#08b8d4]/5 blur-2xl" />

          <div className="relative flex flex-col justify-between gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:px-9 lg:py-8">

            <div className="flex items-center gap-5">

              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#0cc3df] to-[#078ca5] text-3xl font-black text-white shadow-lg shadow-cyan-950/30">
                {initial}
              </div>

              <div className="min-w-0">

                <p className="text-[9px] font-black uppercase tracking-[0.23em] text-[#08b8d4]">
                  LOANKARTS CONNECTOR
                </p>

                <h2 className="mt-1 truncate text-2xl font-black text-white sm:text-3xl">
                  {displayName}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-3">

                  {profile?.connector_code && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black text-white/60">
                      ID: {profile.connector_code}
                    </span>
                  )}

                  <span className="flex items-center gap-2 text-[10px] font-bold text-white/45">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                      <span className="relative h-2.5 w-2.5 rounded-full bg-green-400" />
                    </span>
                    Account Active
                  </span>

                </div>

              </div>
            </div>


            <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-4 lg:min-w-[250px]">

              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
                REGISTERED EMAIL
              </p>

              <p className="mt-1 truncate text-sm font-bold text-white/80">
                {form.email || "Not available"}
              </p>

              <p className="mt-2 text-[9px] text-white/30">
                Keep your information updated
              </p>

            </div>

          </div>
        </div>


        {/* =====================================================
            PERSONAL INFORMATION
            ===================================================== */}

        <div className="mt-6 rounded-[26px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(6,37,54,0.06)]">

          <div className="border-b border-slate-100 px-6 py-5 sm:px-7">

            <SectionHeading
              number="01"
              title="Personal Information"
              subtitle="Your basic connector account information."
            />

          </div>


          <div className="p-6 sm:p-7 lg:p-8">

            <div className="grid gap-5 md:grid-cols-2">

              <Input
                label="Full Name"
                value={form.full_name}
                onChange={(value) =>
                  updateField("full_name", value)
                }
                placeholder="Enter your full name"
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(value) =>
                  updateField("email", value)
                }
                placeholder="Enter email address"
                required
              />

              <Input
                label="Phone Number"
                value={form.phone}
                onChange={(value) =>
                  updateField("phone", value)
                }
                placeholder="Enter phone number"
              />

              <Input
                label="Alternate Phone"
                value={form.alternate_phone}
                onChange={(value) =>
                  updateField(
                    "alternate_phone",
                    value
                  )
                }
                placeholder="Enter alternate phone"
              />

              <Input
                label="Date of Birth"
                type="date"
                value={form.date_of_birth}
                onChange={(value) =>
                  updateField(
                    "date_of_birth",
                    value
                  )
                }
              />

              <Select
                label="Gender"
                value={form.gender}
                onChange={(value) =>
                  updateField("gender", value)
                }
                options={[
                  {
                    label: "Select Gender",
                    value: "",
                  },
                  {
                    label: "Male",
                    value: "Male",
                  },
                  {
                    label: "Female",
                    value: "Female",
                  },
                  {
                    label: "Other",
                    value: "Other",
                  },
                ]}
              />

            </div>

          </div>
        </div>


        {/* =====================================================
            ADDRESS
            ===================================================== */}

        <div className="mt-6 rounded-[26px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(6,37,54,0.06)]">

          <div className="border-b border-slate-100 px-6 py-5 sm:px-7">

            <SectionHeading
              number="02"
              title="Address Details"
              subtitle="Your current residential or business address."
            />

          </div>


          <div className="p-6 sm:p-7 lg:p-8">

            <div className="grid gap-5 md:grid-cols-2">

              <div className="md:col-span-2">

                <TextArea
                  label="Full Address"
                  value={form.address}
                  onChange={(value) =>
                    updateField("address", value)
                  }
                  placeholder="Enter complete address"
                />

              </div>

              <Input
                label="City"
                value={form.city}
                onChange={(value) =>
                  updateField("city", value)
                }
                placeholder="Enter city"
              />

              <Input
                label="State"
                value={form.state}
                onChange={(value) =>
                  updateField("state", value)
                }
                placeholder="Enter state"
              />

              <Input
                label="Pincode"
                value={form.pincode}
                onChange={(value) =>
                  updateField("pincode", value)
                }
                placeholder="6 digit pincode"
                maxLength={6}
              />

            </div>

          </div>
        </div>


        {/* =====================================================
            BANK DETAILS
            ===================================================== */}

        <div className="mt-6 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(6,37,54,0.06)]">

          <div className="border-b border-slate-100 bg-gradient-to-r from-[#f7fcfd] via-white to-[#faffff] px-6 py-5 sm:px-7">

            <SectionHeading
              number="03"
              title="Bank Details"
              subtitle="Bank account information for your commission payouts."
            />

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3.5">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm shadow-sm">
                🔐
              </div>

              <div>
                <p className="text-[10px] font-black text-amber-800">
                  SECURE PAYOUT INFORMATION
                </p>

                <p className="mt-0.5 text-[10px] leading-4 text-amber-700">
                  Please make sure your bank details are correct before saving. These details may be used for commission payouts.
                </p>
              </div>

            </div>

          </div>


          <div className="p-6 sm:p-7 lg:p-8">

            <div className="grid gap-5 md:grid-cols-2">

              <Input
                label="Account Holder Name"
                value={form.account_holder_name}
                onChange={(value) =>
                  updateField(
                    "account_holder_name",
                    value
                  )
                }
                placeholder="Name as per bank account"
              />

              <Input
                label="Bank Name"
                value={form.bank_name}
                onChange={(value) =>
                  updateField(
                    "bank_name",
                    value
                  )
                }
                placeholder="Enter bank name"
              />

              <Input
                label="Account Number"
                value={form.account_number}
                onChange={(value) =>
                  updateField(
                    "account_number",
                    value
                  )
                }
                placeholder="Enter account number"
              />

              <Input
                label="IFSC Code"
                value={form.ifsc_code}
                onChange={(value) =>
                  updateField(
                    "ifsc_code",
                    value
                  )
                }
                placeholder="e.g. SBIN0001234"
                maxLength={11}
              />

              <Input
                label="Branch Name"
                value={form.branch_name}
                onChange={(value) =>
                  updateField(
                    "branch_name",
                    value
                  )
                }
                placeholder="Enter branch name"
              />

              <Select
                label="Account Type"
                value={form.account_type}
                onChange={(value) =>
                  updateField(
                    "account_type",
                    value
                  )
                }
                options={[
                  {
                    label: "Select Account Type",
                    value: "",
                  },
                  {
                    label: "Savings Account",
                    value: "Savings",
                  },
                  {
                    label: "Current Account",
                    value: "Current",
                  },
                ]}
              />

            </div>

          </div>
        </div>


        {/* =====================================================
            CONNECTOR INFORMATION
            ===================================================== */}

        <div className="mt-6 rounded-[26px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(6,37,54,0.06)]">

          <div className="border-b border-slate-100 px-6 py-5 sm:px-7">

            <SectionHeading
              number="04"
              title="Connector Information"
              subtitle="Your official LoanKarts partner identification."
            />

          </div>


          <div className="p-6 sm:p-7 lg:p-8">

            <div className="flex flex-col justify-between gap-5 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-white p-5 sm:flex-row sm:items-center">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-lg font-black text-[#08b8d4] shadow-sm">
                  ID
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-700">
                    CONNECTOR ID
                  </p>

                  <p className="mt-1 text-xl font-black text-[#062536]">
                    {profile?.connector_code ||
                      "Not Assigned"}
                  </p>
                </div>

              </div>


              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black text-slate-500 shadow-sm">
                🔒 Read Only
              </div>

            </div>

          </div>
        </div>


        {/* =====================================================
            SAVE BAR
            ===================================================== */}

        <div className="sticky bottom-4 z-30 mt-6">

          <div className="flex flex-col justify-between gap-4 rounded-[22px] border border-slate-200 bg-white/95 p-5 shadow-[0_15px_45px_rgba(6,37,54,0.14)] backdrop-blur-xl sm:flex-row sm:items-center sm:px-6">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#062536] text-lg text-[#08b8d4]">
                ✓
              </div>

              <div>

                <p className="text-sm font-black text-[#062536]">
                  Keep your profile updated
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  Changes will be saved securely to your connector account.
                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex min-w-[190px] items-center justify-center gap-2.5 rounded-xl bg-[#08b8d4] px-7 py-3.5 text-xs font-black text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-[#079eb7] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  SAVING...
                </>
              ) : (
                <>
                  <span>✓</span>
                  SAVE CHANGES
                </>
              )}

            </button>

          </div>

        </div>


        {/* FOOTER */}

        <div className="flex flex-col justify-between gap-2 px-1 pb-8 pt-6 text-[10px] text-slate-400 sm:flex-row">

          <p>
            LoanKarts Connector Partner Portal
          </p>

          <p>
            Secure profile &amp; payout information
          </p>

        </div>

      </section>
    </main>
  );
}


/* =========================================================
   SECTION HEADING
   ========================================================= */

function SectionHeading({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-4">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#062536] text-[10px] font-black text-[#08b8d4] shadow-sm">
        {number}
      </div>

      <div>
        <h2 className="text-base font-black text-[#062536] sm:text-lg">
          {title}
        </h2>

        <p className="mt-0.5 text-[10px] text-slate-500">
          {subtitle}
        </p>
      </div>

    </div>
  );
}


/* =========================================================
   INPUT
   ========================================================= */

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div>

      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">

        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </label>

      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="h-[47px] w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 text-xs font-semibold text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#08b8d4] focus:bg-white focus:ring-4 focus:ring-cyan-50"
      />

    </div>
  );
}


/* =========================================================
   TEXTAREA
   ========================================================= */

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-3.5 text-xs font-semibold text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#08b8d4] focus:bg-white focus:ring-4 focus:ring-cyan-50"
      />

    </div>
  );
}


/* =========================================================
   SELECT
   ========================================================= */

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    label: string;
    value: string;
  }[];
}) {
  return (
    <div>

      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="h-[47px] w-full cursor-pointer rounded-xl border border-slate-200 bg-[#f8fafc] px-4 text-xs font-semibold text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-[#08b8d4] focus:bg-white focus:ring-4 focus:ring-cyan-50"
      >

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}

      </select>

    </div>
  );
}