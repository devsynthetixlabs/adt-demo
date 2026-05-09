export interface Material {
  id: number | string;
  name: string;
  cat: string;
  unit: string;
  room: string;
  vendor: string;
  qty: string;
  orderDate: string;
  eta: string;
  status: string;
  notes: string;
  receivedBy?: string;
  receivedDate?: string;
  images?: string[];
}

export interface Approval {
  id: number | string;
  desc: string;
  type: string;
  unit: string;
  by: string;
  submitted: string;
  responded: string;
  status: string;
  remarks: string;
}

export interface Drawing {
  id: number;
  name: string;
  type: string;
  unit: string;
  size: string;
  date: string;
  icon: string;
}

export interface CommsMessage {
  id: number;
  sender: string;
  text: string;
  time: string;
  outgoing: boolean;
  tag?: string;
}

