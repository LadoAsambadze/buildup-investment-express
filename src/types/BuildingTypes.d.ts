export type BuildingTypes = {
  id: number;
  name: string;
  address: string;
  company_id: id;
  desktop_image?: Express.Multer.File;
  mobile_image?: Express.Multer.File;
  desktop_paths: string[];
  mobile_paths: string[];
};