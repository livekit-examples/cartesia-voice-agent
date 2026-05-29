import { useMediaDeviceSelect } from "@livekit/components-react";
import { useEffect, useState } from "react";

type DeviceSelectorProps = {
  kind: MediaDeviceKind;
};

export const DeviceSelector = ({ kind }: DeviceSelectorProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const deviceSelect = useMediaDeviceSelect({ kind: kind });
  const [selectedDeviceName, setSelectedDeviceName] = useState("");

  useEffect(() => {
    deviceSelect.devices.forEach((device) => {
      if (device.deviceId === deviceSelect.activeDeviceId) {
        setSelectedDeviceName(device.label);
      }
    });
  }, [deviceSelect.activeDeviceId, deviceSelect.devices, selectedDeviceName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu) {
        setShowMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showMenu]);

  const activeClassName = showMenu ? "rotate-180" : "rotate-0";

  return (
    <div className="relative">
      <button
        className={`flex hover:opacity-50 ${activeClassName} transition-all duration-100 p-2`}
        onClick={(e) => {
          setShowMenu(!showMenu);
          e.stopPropagation();
        }}
      >
        <ChevronSVG />
      </button>
      <div
        className="absolute left-0 bottom-12 text-black text-left border-black border-2 z-10 w-70"
        style={{
          display: showMenu ? "block" : "none",
        }}
      >
        {deviceSelect.devices.map((device, index) => {
          return (
            <div
              onClick={(e) => {
                e.stopPropagation();
                deviceSelect.setActiveMediaDevice(device.deviceId);
                setShowMenu(false);
              }}
              className={`${
                device.deviceId === deviceSelect.activeDeviceId
                  ? "text-black"
                  : "text-gray-500"
              } bg-white text-xs py-2 px-2 cursor-pointer hover:bg-gray-800 hover:text-white`}
              key={index}
            >
              {device.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ChevronSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
  >
    <path
      d="M13.3334 6L8.00003 11.3333L2.66669 6"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);
