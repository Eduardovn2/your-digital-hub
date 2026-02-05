import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

export const useDevice = () => {
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    // Tenta pegar do armazenamento local
    let storedId = localStorage.getItem("store_device_id");

    // Se não existir, cria um novo "RG" para este celular/pc
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem("store_device_id", storedId);
    }

    setDeviceId(storedId);
  }, []);

  return deviceId;
};