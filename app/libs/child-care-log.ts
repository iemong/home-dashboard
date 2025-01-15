export interface RichText {
  type: "text";
  text: {
    content: string;
    link: string | null;
  };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text: string;
  href: string | null;
}

export interface ChildCareLog {
  /** 補足 */
  補足: {
    id: string;
    type: "rich_text";
    rich_text: RichText[];
  };
  Kind: {
    id: string;
    type: "select";
    select: {
      id: string;
      name: string;
      color: string;
    };
  };
  "Last edited time": {
    id: string;
    type: "last_edited_time";
    last_edited_time: string;
  };
  Quantity: {
    id: string;
    type: "number";
    number: number;
  };
  "Created time": {
    id: string;
    type: "created_time";
    created_time: string;
  };
  "Registered time": {
    id: string;
    type: "date";
    date: {
      start: string;
      end: string | null;
      time_zone: string | null;
    };
  };
  "Childcare id": {
    id: string;
    type: "unique_id";
    unique_id: {
      prefix: string;
      number: number;
    };
  };
  Name: {
    id: "title";
    type: "title";
    title: Array<{
      type: "text";
      text: {
        content: string;
        link: string | null;
      };
      annotations: {
        bold: boolean;
        italic: boolean;
        strikethrough: boolean;
        underline: boolean;
        code: boolean;
        color: string;
      };
      plain_text: string;
      href: string | null;
    }>;
  };
}