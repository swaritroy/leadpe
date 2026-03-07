import { supabase } from "@/integrations/supabase/client";

const ADMIN = import.meta.env
  .VITE_ADMIN_WHATSAPP

export const sendWhatsApp = async (
  to: string,
  message: string,
  businessId?: string,
  messageType?: string,
  language?: string
) => {
  try {
    const { data, error } = 
      await supabase.functions.invoke(
        'send-whatsapp',
        { body: { to, message } }
      )
    
    if (error) throw error
    
    await (supabase
      .from('message_log' as any) as any)
      .insert({
        to_number: to,
        message,
        status: 'sent',
        channel: 'whatsapp',
        business_id: businessId || null,
        message_type: messageType || 'general',
        language: language || 'hinglish',
        sent_at: new Date().toISOString()
      })
    
    return { success: true }
  } catch (err) {
    console.error('WhatsApp failed:', err)
    
    // Log the failure
    await (supabase
      .from('message_log' as any) as any)
      .insert({
        to_number: to,
        message,
        status: 'failed',
        channel: 'whatsapp',
        business_id: businessId || null,
        message_type: messageType || 'general',
        language: language || 'hinglish',
        sent_at: new Date().toISOString()
      })
    
    // Fallback to wa.me URL
    window.open(
      `https://wa.me/${to}?text=${encodeURIComponent(message)}`,
      '_blank'
    )
    return { success: false }
  }
}

type Lang = 'english'|'hindi'|'hinglish'

export const getMessage = (
  type: string,
  lang: Lang = 'hinglish',
  data: any
) => {
  const messages: any = {

    newSignup: {
      english:
        `🔔 NEW SIGNUP — LeadPe\n` +
        `━━━━━━━━━━━━━━\n` +
        `Business: ${data.businessName}\n` +
        `Type: ${data.businessType}\n` +
        `City: ${data.city}\n` +
        `WhatsApp: ${data.whatsapp}\n` +
        `Owner: ${data.ownerName}\n` +
        `Code: ${data.trialCode}\n` +
        `━━━━━━━━━━━━━━\n` +
        `LeadPe ⚡`,

      hindi:
        `🔔 नया साइनअप — LeadPe\n` +
        `━━━━━━━━━━━━━━\n` +
        `व्यवसाय: ${data.businessName}\n` +
        `प्रकार: ${data.businessType}\n` +
        `शहर: ${data.city}\n` +
        `WhatsApp: ${data.whatsapp}\n` +
        `मालिक: ${data.ownerName}\n` +
        `कोड: ${data.trialCode}\n` +
        `━━━━━━━━━━━━━━\n` +
        `LeadPe ⚡`,

      hinglish:
        `🔔 NAYA SIGNUP — LeadPe\n` +
        `━━━━━━━━━━━━━━\n` +
        `Business: ${data.businessName}\n` +
        `Type: ${data.businessType}\n` +
        `City: ${data.city}\n` +
        `WhatsApp: ${data.whatsapp}\n` +
        `Owner: ${data.ownerName}\n` +
        `Code: ${data.trialCode}\n` +
        `━━━━━━━━━━━━━━\n` +
        `LeadPe ⚡` 
    },

    welcomeOwner: {
      english:
        `Welcome to LeadPe! 🎉\n\n` +
        `Hi ${data.ownerName},\n` +
        `Your trial has started.\n` +
        `Trial Code: ${data.trialCode}\n\n` +
        `Our team will contact you\n` +
        `within 2 hours to start\n` +
        `building your website.\n\n` +
        `LeadPe ⚡ leadpe.online`,

      hindi:
        `LeadPe में स्वागत है! 🎉\n\n` +
        `${data.ownerName} जी,\n` +
        `आपका trial शुरू हो गया।\n` +
        `Trial Code: ${data.trialCode}\n\n` +
        `हमारी team 2 घंटे में\n` +
        `आपसे WhatsApp करेगी।\n\n` +
        `LeadPe ⚡ leadpe.online`,

      hinglish:
        `LeadPe mein aapka swagat hai! 🎉\n\n` +
        `${data.ownerName} ji,\n` +
        `Aapka trial shuru ho gaya.\n` +
        `Trial Code: ${data.trialCode}\n\n` +
        `Hamari team 2 ghante mein\n` +
        `aapse WhatsApp karegi.\n\n` +
        `LeadPe ⚡ leadpe.online` 
    },

    siteDeployed: {
      english:
        `🚀 Your website is LIVE!\n\n` +
        `${data.ownerName},\n` +
        `Your website is now live:\n` +
        `👉 ${data.siteUrl}\n\n` +
        `Share it in your WhatsApp\n` +
        `groups now — first leads\n` +
        `may arrive tonight! 🔔\n\n` +
        `LeadPe ⚡`,

      hindi:
        `🚀 आपकी वेबसाइट LIVE है!\n\n` +
        `${data.ownerName} जी,\n` +
        `आपकी website live है:\n` +
        `👉 ${data.siteUrl}\n\n` +
        `अपने WhatsApp groups में\n` +
        `share करें! 🔔\n\n` +
        `LeadPe ⚡`,

      hinglish:
        `🚀 Aapki website LIVE hai!\n\n` +
        `${data.ownerName} ji,\n` +
        `Aapki website ab live hai:\n` +
        `👉 ${data.siteUrl}\n\n` +
        `Apne WhatsApp groups mein\n` +
        `share karein aaj! 🔔\n\n` +
        `LeadPe ⚡` 
    },

    newLead: {
      english:
        `🔔 NEW INQUIRY\n` +
        `━━━━━━━━━━━━━━\n` +
        `Name: ${data.customerName}\n` +
        `Phone: ${data.customerPhone}\n` +
        `Interest: ${data.interest}\n` +
        `Time: ${data.time}\n` +
        `━━━━━━━━━━━━━━\n` +
        `Call now to close! 📞\n` +
        `LeadPe ⚡`,

      hindi:
        `🔔 नई इन्क्वायरी\n` +
        `━━━━━━━━━━━━━━\n` +
        `नाम: ${data.customerName}\n` +
        `फोन: ${data.customerPhone}\n` +
        `रुचि: ${data.interest}\n` +
        `━━━━━━━━━━━━━━\n` +
        `अभी call करें! 📞\n` +
        `LeadPe ⚡`,

      hinglish:
        `🔔 NAYA INQUIRY\n` +
        `━━━━━━━━━━━━━━\n` +
        `Naam: ${data.customerName}\n` +
        `Number: ${data.customerPhone}\n` +
        `Interest: ${data.interest}\n` +
        `━━━━━━━━━━━━━━\n` +
        `Abhi call karein! 📞\n` +
        `LeadPe ⚡` 
    },

    day1: {
      english:
        `Hi ${data.ownerName}! 👋\n\n` +
        `Your website is live:\n` +
        `👉 ${data.siteUrl}\n\n` +
        `Share it in local WhatsApp\n` +
        `groups now for fast leads!\n\n` +
        `LeadPe ⚡`,

      hindi:
        `${data.ownerName} जी! 👋\n\n` +
        `आपकी website live है:\n` +
        `👉 ${data.siteUrl}\n\n` +
        `Local WhatsApp groups में\n` +
        `share करें जल्दी leads के लिए!\n\n` +
        `LeadPe ⚡`,

      hinglish:
        `${data.ownerName} ji! 👋\n\n` +
        `Aapki website live hai:\n` +
        `👉 ${data.siteUrl}\n\n` +
        `Local WhatsApp groups mein\n` +
        `share karein — leads jaldi\n` +
        `aayenge! 🔔\n\n` +
        `LeadPe ⚡` 
    },

    day6: {
      english:
        `${data.ownerName}, trial ends\n` +
        `tomorrow! ⏰\n\n` +
        `This week: ${data.leads} inquiries\n\n` +
        `Continue for ₹299/month\n` +
        `1 customer = ₹1,500+\n` +
        `LeadPe = ₹299\n` +
        `Your profit = ₹1,201 💰\n\n` +
        `LeadPe ⚡`,

      hindi:
        `${data.ownerName} जी, कल\n` +
        `trial खत्म! ⏰\n\n` +
        `इस हफ्ते: ${data.leads} inquiries\n\n` +
        `जारी रखें: ₹299/महीना\n` +
        `1 ग्राहक = ₹1,500+\n` +
        `LeadPe = ₹299\n` +
        `मुनाफा = ₹1,201 💰\n\n` +
        `LeadPe ⚡`,

      hinglish:
        `${data.ownerName} ji, kal\n` +
        `trial khatam! ⏰\n\n` +
        `Is hafte: ${data.leads} inquiries\n\n` +
        `Continue karein: ₹299/month\n` +
        `1 customer = ₹1,500+\n` +
        `LeadPe = ₹299\n` +
        `Net profit = ₹1,201 💰\n\n` +
        `LeadPe ⚡` 
    },

    day7: {
      english:
        `${data.ownerName}, trial\n` +
        `complete! 🙏\n\n` +
        `Results: ${data.leads} inquiries\n\n` +
        `To continue:\n` +
        `₹299/month\n` +
        `Pay via GPay: 9973383902\n\n` +
        `Send screenshot after payment.\n` +
        `Activated in 5 minutes. ✅\n\n` +
        `LeadPe ⚡`,

      hindi:
        `${data.ownerName} जी, trial\n` +
        `पूरा हुआ! 🙏\n\n` +
        `Results: ${data.leads} inquiries\n\n` +
        `जारी रखें: ₹299/महीना\n` +
        `GPay: 9973383902\n\n` +
        `Screenshot भेजें.\n` +
        `5 मिनट में activate. ✅\n\n` +
        `LeadPe ⚡`,

      hinglish:
        `${data.ownerName} ji, trial\n` +
        `complete! 🙏\n\n` +
        `Results: ${data.leads} inquiries\n\n` +
        `Continue karein: ₹299/month\n` +
        `GPay: 9973383902\n\n` +
        `Screenshot bhejein.\n` +
        `5 min mein activate. ✅\n\n` +
        `LeadPe ⚡` 
    },

    buildRequestCreated: {
      english:
        `🔨 NEW BUILD REQUEST\n` +
        `━━━━━━━━━━━━━━\n` +
        `Business: ${data.businessName}\n` +
        `Type: ${data.businessType}\n` +
        `City: ${data.city}\n` +
        `Owner: ${data.ownerName}\n` +
        `WhatsApp: ${data.whatsapp}\n` +
        `Plan: ${data.plan}\n` +
        `Deadline: 48 hours\n` +
        `━━━━━━━━━━━━━━\n` +
        `Assign a vibe coder now!\n` +
        `LeadPe ⚡`,

      hindi:
        `🔨 नया बिल्ड रिक्वेस्ट\n` +
        `━━━━━━━━━━━━━━\n` +
        `व्यवसाय: ${data.businessName}\n` +
        `प्रकार: ${data.businessType}\n` +
        `शहर: ${data.city}\n` +
        `मालिक: ${data.ownerName}\n` +
        `WhatsApp: ${data.whatsapp}\n` +
        `प्लान: ${data.plan}\n` +
        `डेडलाइन: 48 घंटे\n` +
        `━━━━━━━━━━━━━━\n` +
        `अभी coder assign करें!\n` +
        `LeadPe ⚡`,

      hinglish:
        `🔨 NAYA BUILD REQUEST\n` +
        `━━━━━━━━━━━━━━\n` +
        `Business: ${data.businessName}\n` +
        `Type: ${data.businessType}\n` +
        `City: ${data.city}\n` +
        `Owner: ${data.ownerName}\n` +
        `WhatsApp: ${data.whatsapp}\n` +
        `Plan: ${data.plan}\n` +
        `Deadline: 48 hours\n` +
        `━━━━━━━━━━━━━━\n` +
        `Abhi coder assign karein!\n` +
        `LeadPe ⚡`
    },

    requestAccepted: {
      english:
        `✅ REQUEST ACCEPTED\n` +
        `━━━━━━━━━━━━━━\n` +
        `Coder: ${data.coderName}\n` +
        `Business: ${data.businessName}\n` +
        `City: ${data.city}\n` +
        `ETA: 48 hours\n` +
        `━━━━━━━━━━━━━━\n` +
        `LeadPe ⚡`,

      hindi:
        `✅ रिक्वेस्ट अक्सेप्टेड\n` +
        `━━━━━━━━━━━━━━\n` +
        `Coder: ${data.coderName}\n` +
        `Business: ${data.businessName}\n` +
        `City: ${data.city}\n` +
        `ETA: 48 घंटे\n` +
        `━━━━━━━━━━━━━━\n` +
        `LeadPe ⚡`,

      hinglish:
        `✅ REQUEST ACCEPTED\n` +
        `━━━━━━━━━━━━━━\n` +
        `Coder: ${data.coderName}\n` +
        `Business: ${data.businessName}\n` +
        `City: ${data.city}\n` +
        `ETA: 48 hours\n` +
        `━━━━━━━━━━━━━━\n` +
        `LeadPe ⚡`
    },

    buildStarted: {
      english:
        `🎉 Great news ${data.ownerName}!\n` +
        `Your website building has started.\n` +
        `Builder: ${data.coderName}\n` +
        `Ready in: 48 hours 🚀\n` +
        `LeadPe ⚡`,

      hindi:
        `🎉 बढ़िया खबर ${data.ownerName} जी!\n` +
        `आपकी website बनाना शुरू हो गया।\n` +
        `Builder: ${data.coderName}\n` +
        `तैयार: 48 घंटे में 🚀\n` +
        `LeadPe ⚡`,

      hinglish:
        `🎉 Badiya khabar ${data.ownerName} ji!\n` +
        `Aapki website banana shuru ho gaya.\n` +
        `Builder: ${data.coderName}\n` +
        `Ready in: 48 hours 🚀\n` +
        `LeadPe ⚡`
    },

    weeklyReport: {
      english:
        `📊 WEEKLY REPORT\n` +
        `━━━━━━━━━━━━━━\n` +
        `${data.businessName}\n` +
        `Week: ${data.week}\n` +
        `━━━━━━━━━━━━━━\n` +
        `👁 Visitors: ${data.visitors}\n` +
        `📋 Inquiries: ${data.leads}\n` +
        `📈 Growth: ${data.growth}%\n` +
        `⚡ Site: Healthy ✅\n` +
        `━━━━━━━━━━━━━━\n` +
        `${data.tip}\n` +
        `LeadPe ⚡`,

      hindi:
        `📊 साप्ताहिक रिपोर्ट\n` +
        `━━━━━━━━━━━━━━\n` +
        `${data.businessName}\n` +
        `सप्ताह: ${data.week}\n` +
        `━━━━━━━━━━━━━━\n` +
        `👁 विज़िटर: ${data.visitors}\n` +
        `📋 इन्क्वायरी: ${data.leads}\n` +
        `📈 वृद्धि: ${data.growth}%\n` +
        `⚡ साइट: ठीक है ✅\n` +
        `━━━━━━━━━━━━━━\n` +
        `${data.tip}\n` +
        `LeadPe ⚡`,

      hinglish:
        `📊 WEEKLY REPORT\n` +
        `━━━━━━━━━━━━━━\n` +
        `${data.businessName}\n` +
        `Hafte: ${data.week}\n` +
        `━━━━━━━━━━━━━━\n` +
        `👁 Visitors: ${data.visitors}\n` +
        `📋 Inquiries: ${data.leads}\n` +
        `📈 Growth: ${data.growth}%\n` +
        `⚡ Site: Healthy ✅\n` +
        `━━━━━━━━━━━━━━\n` +
        `${data.tip}\n` +
        `LeadPe ⚡` 
    }
  }

  return messages[type]?.[lang] || 
         messages[type]?.['hinglish']
}

export { ADMIN }
