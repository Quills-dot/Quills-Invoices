export type InvoiceStatus = "draft" | "sent" | "paid" | "void";

/** What the UI shows. "overdue" is derived, never stored. */
export type DisplayStatus = InvoiceStatus | "overdue";

export type Client = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  company: string | null;
  notes: string | null;
  created_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  position: number;
};

export type Invoice = {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  tax_rate: number;
  currency: string;
  notes: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
};

/** An invoice joined with its client and line items. */
export type InvoiceWithDetails = Invoice & {
  clients: Pick<Client, "id" | "name" | "company" | "email"> | null;
  invoice_items: InvoiceItem[];
};
