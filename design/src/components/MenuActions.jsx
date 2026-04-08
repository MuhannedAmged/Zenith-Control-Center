import {
  ClockCheck,
  Laptop,
  Music,
  Video,
  Settings,
  CloudSun,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { memo } from "react";

const actionBtns = [
  {
    id: 1,
    name: "Device",
    icon: <Laptop size={15} strokeWidth={2.5} />,
  },
  { id: 2, name: "Weather", icon: <CloudSun size={15} strokeWidth={2.5} /> },
  { id: 3, name: "Music", icon: <Music size={15} strokeWidth={2.5} /> },
  {
    id: 4,
    name: "Notes",
    icon: <FileText size={15} strokeWidth={2.5} />,
  },
  { id: 5, name: "Video", icon: <Video size={15} strokeWidth={2.5} /> },
  { id: 6, name: "Timer", icon: <ClockCheck size={15} strokeWidth={2.5} /> },
  {
    id: 7,
    name: "Settings",
    icon: <Settings size={15} strokeWidth={2.5} />,
  },
];

export const MenuActions = memo(({ activeMenu, setActiveMenu }) => {
  return (
    <motion.div
      className="relative z-50 -mt-1 clickable"
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.4 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-end gap-1.5 clickable">
        {actionBtns.map((action) => (
          <button
            key={action.id}
            aria-label={action.name}
            className={`group
              p-2 rounded-full bg-glass text-(--text-primary) cursor-pointer transition-transform
              ${[1, 7].includes(action.id) ? "mb-11" : ""} 
              ${[2, 6].includes(action.id) ? "mb-6" : ""} 
              ${[3, 5].includes(action.id) ? "mb-2" : ""} 
            `}
            onClick={() =>
              activeMenu === action.id
                ? setActiveMenu(null)
                : setActiveMenu(action.id)
            }
          >
            {action.icon}
            <span className="absolute text-[8px] -top-12 left-1/2 -translate-x-1/2 translate-y-full bg-glass text-(--text-primary) px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              {action.name}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
});
