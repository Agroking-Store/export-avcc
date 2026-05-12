import multer from "multer";
import path from "path";
import fs from "fs";

// Dynamic storage configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // Determine folder based on URL or a query param
//     const isVehicleDoc = req.originalUrl.includes("vehicles");
//     const folder = isVehicleDoc ? "uploads/vehicles" : "uploads/lcs";

//     const uploadDir = path.join(process.cwd(), folder);

//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     const prefix = req.originalUrl.includes("vehicles") ? "veh" : "lc";
//     cb(
//       null,
//       `${prefix}-${req.params.id || "new"}-${uniqueSuffix}${path.extname(file.originalname)}`,
//     );
//   },
// });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/others";
    if (req.originalUrl.includes("vehicles")) folder = "uploads/vehicles";
    else if (req.originalUrl.includes("lc")) folder = "uploads/lcs";
    else if (req.originalUrl.includes("hbl")) folder = "uploads/hbls";

    const uploadDir = path.join(process.cwd(), folder);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    let prefix = "doc";
    if (req.originalUrl.includes("vehicles")) prefix = "veh";
    else if (req.originalUrl.includes("lc")) prefix = "lc";
    else if (req.originalUrl.includes("hbl")) prefix = "hbl";

    cb(
      null,
      `${prefix}-${req.params.id || "new"}-${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Allow PDFs and Images for registration docs
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPG, and PNG files are allowed!"), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
