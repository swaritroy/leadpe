import { motion, AnimatePresence } from "framer-motion";
import LeadPeLogo from "./LeadPeLogo";

interface SplashScreenProps {
  show: boolean;
}

const SplashScreen = ({ show }: SplashScreenProps) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 z-[9999] flex items-end justify-center pb-24 bg-white"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.25 } }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LeadPeLogo theme="light" size="xl" />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default SplashScreen;
