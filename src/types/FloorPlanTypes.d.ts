// types/FloorPlanTypes.ts

export interface FloorPlanType {
  id?: number;
  name: string;
  building_id: number;
  desktop_image?: Express.Multer.File;
  mobile_image?: Express.Multer.File;
  desktop_paths: any;
  mobile_paths: any;
  floor_range_start: number;
  floor_range_end: number;
  starting_apartment_number: number;
  apartments_per_floor: number;
}

 

 