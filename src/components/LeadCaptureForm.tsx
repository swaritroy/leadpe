import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { sendWhatsApp, getMessage } from "@/lib/whatsappService";

interface LeadCaptureFormProps {
  businessId: string;
  businessName: string;
  ownerWhatsapp: string;
}

export default function LeadCaptureForm({ businessId, businessName, ownerWhatsapp }: LeadCaptureFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    interest: "",
    message: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setError("");
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Please enter your name";
    }
    
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (!phoneDigits) {
      newErrors.phone = "Please enter your phone number";
    } else if (phoneDigits.length !== 10) {
      newErrors.phone = "Please enter a valid 10-digit number";
    }
    
    if (!formData.interest.trim()) {
      newErrors.interest = "Please tell us what you're looking for";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setSubmitting(true);
    setError("");

    const phoneDigits = formData.phone.replace(/\D/g, "");
    const timestamp = new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    try {
      // Save to Supabase
      const { error: dbError } = await (supabase.from("leads") as any).insert({
        business_id: businessId,
        business_name: businessName,
        customer_name: formData.name,
        customer_phone: phoneDigits,
        interest: formData.interest,
        message: formData.message || null,
        source: "website",
        status: "new",
        created_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      // Send WhatsApp to business owner using new service
      const leadData = {
        customerName: formData.name,
        customerPhone: phoneDigits,
        interest: formData.interest,
        time: timestamp
      };

      await sendWhatsApp(
        ownerWhatsapp,
        getMessage('newLead', 'hinglish', leadData),
        businessId,
        'newLead',
        'hinglish'
      );

      setSuccess(true);
    } catch (err) {
      console.error("Lead submission error:", err);
      setError("Something went wrong. Please try again or call us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border-2 p-6 text-center"
        style={{ backgroundColor: "#101810", borderColor: "#00E676", boxShadow: "0 0 30px rgba(0, 230, 118, 0.2)" }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 230, 118, 0.1)" }}
        >
          <CheckCircle size={40} style={{ color: "#00E676" }} />
        </motion.div>
        
        <h3 className="text-xl font-bold mb-2">Inquiry Sent! ✅</h3>
        <p className="text-muted-foreground mb-2">
          {businessName} will contact you within 1 hour on WhatsApp.
        </p>
        <p className="text-sm text-muted-foreground">
          Thank you for reaching out.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border-2 p-5 md:p-6"
      style={{ backgroundColor: "#101810", borderColor: "rgba(0, 230, 118, 0.3)", boxShadow: "0 0 30px rgba(0, 230, 118, 0.1)" }}
    >
      <h3 className="text-xl font-bold mb-1">Get in Touch</h3>
      <p className="text-sm text-muted-foreground mb-5">
        We'll contact you within 1 hour.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            className={`h-12 rounded-xl border ${errors.name ? "border-red-500" : "border-border"}`}
            style={{ backgroundColor: "#080C09" }}
            placeholder="Your name *"
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.name}
            </p>
          )}
        </div>

        <div>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
            className={`h-12 rounded-xl border ${errors.phone ? "border-red-500" : "border-border"}`}
            style={{ backgroundColor: "#080C09" }}
            placeholder="Your WhatsApp number *"
          />
          {errors.phone && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.phone}
            </p>
          )}
        </div>

        <div>
          <Input
            value={formData.interest}
            onChange={(e) => updateField("interest", e.target.value)}
            className={`h-12 rounded-xl border ${errors.interest ? "border-red-500" : "border-border"}`}
            style={{ backgroundColor: "#080C09" }}
            placeholder="What are you looking for? *"
          />
          {errors.interest && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.interest}
            </p>
          )}
        </div>

        <div>
          <textarea
            value={formData.message}
            onChange={(e) => updateField("message", e.target.value)}
            className="w-full h-24 rounded-xl border border-border p-3 text-sm outline-none resize-none"
            style={{ backgroundColor: "#080C09" }}
            placeholder="Any other details... (optional)"
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-500 text-center"
          >
            {error}
          </motion.p>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-xl text-black font-semibold"
          style={{ backgroundColor: "#00E676" }}
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Inquiry →"
          )}
        </Button>
      </form>
    </motion.div>
  );
}
