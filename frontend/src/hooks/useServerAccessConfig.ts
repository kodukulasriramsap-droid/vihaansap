import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ServerAccessConfig } from '../types';

const defaultServerAccessConfig: ServerAccessConfig = {
  hero: {
    title: "SAP S/4HANA Server Access",
    subtitle: "Get instant access to professional SAP S/4HANA practice servers for hands-on learning and real-world SAP practice."
  },
  serverDetails: {
    name: "SAP S/4HANA",
    version: "Latest Version",
    landscape: "Practice Server",
    accessType: "Remote",
    availability: "24/7",
    status: "Active",
    description: "Professional practice servers for hands-on learning."
  },
  indianPricing: [
    { id: "ind-1", duration: "1 Month", price: "₹1000", description: "Standard Access", order: 1 },
    { id: "ind-2", duration: "2 Months", price: "₹1800", description: "Standard Access", order: 2 },
    { id: "ind-3", duration: "3 Months", price: "₹2400", description: "Standard Access", order: 3 },
    { id: "ind-4", duration: "6 Months", price: "₹4200", description: "Standard Access", order: 4 },
    { id: "ind-5", duration: "12 Months", price: "₹7200", description: "Standard Access", order: 5 }
  ],
  internationalPricing: [
    { id: "int-1", duration: "1 Month", price: "$30", description: "Standard Access", order: 1 },
    { id: "int-2", duration: "2 Months", price: "$50", description: "Standard Access", order: 2 },
    { id: "int-3", duration: "3 Months", price: "$60", description: "Standard Access", order: 3 },
    { id: "int-4", duration: "6 Months", price: "$90", description: "Standard Access", order: 4 },
    { id: "int-5", duration: "12 Months", price: "$150", description: "Standard Access", order: 5 }
  ],
  paymentDetails: {
    upiId: "Google Pay, PhonePe, UPI",
    accountName: "",
    phoneNumber: "+91 7416797921",
    whatsappNumber: "+91 7416797921",
    email: "k.sapcon@gmail.com",
    instructions: "You can pay using Google Pay, PhonePe or UPI.\nAfter payment,\nsend the payment screenshot to WhatsApp or Email.",
    activationNotes: "Server credentials will be shared after payment verification."
  },
  features: [
    "24x7 Cloud Access",
    "Latest SAP Version",
    "Multiple SAP Modules",
    "Dedicated User Login",
    "Practice Company Data",
    "Real-Time Business Scenarios",
    "Technical Support",
    "Remote Login",
    "Fast Activation",
    "Secure Environment"
  ],
  faq: [],
  contact: {
    phone: "+91 7416797921",
    whatsapp: "+91 7416797921",
    email: "k.sapcon@gmail.com",
    officeTiming: "9 AM to 6 PM",
    supportTiming: "24/7"
  }
};

export function useServerAccessConfig() {
  const [config, setConfig] = useState<ServerAccessConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'config', 'serverAccess');

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as ServerAccessConfig);
        setLoading(false);
      } else {
        // Document does not exist, insert default data
        try {
          setConfig(defaultServerAccessConfig);
          setLoading(false);
          await setDoc(docRef, defaultServerAccessConfig);
        } catch (error) {
          console.error("Error creating default server access config:", error);
          setConfig(defaultServerAccessConfig); // Fallback to memory
          setLoading(false);
        }
      }
    }, (error) => {
      console.error("Error fetching server access config:", error);
      setConfig(defaultServerAccessConfig); // Fallback to memory on error
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { config, loading };
}
