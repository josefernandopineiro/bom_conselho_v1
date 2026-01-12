// Helpers to manage school logo in localStorage

const normalize = (name?: string) => {
  if (!name) return 'default';
  return String(name).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_\-]/g, '');
};

export const saveLogoForSchool = async (schoolName: string | undefined, dataUrl: string) => {
  const key = `schoolLogo_${normalize(schoolName)}`;
  localStorage.setItem(key, dataUrl);
};

export const getLogoForSchool = (schoolName: string | undefined) => {
  const key = `schoolLogo_${normalize(schoolName)}`;
  return localStorage.getItem(key) || null;
};

export const removeLogoForSchool = (schoolName: string | undefined) => {
  const key = `schoolLogo_${normalize(schoolName)}`;
  localStorage.removeItem(key);
};

export const DEFAULT_LOGO_PATH = '/lovable-uploads/b2b0f41c-35cb-4563-ac27-aa9ef6cdf0db.png';
