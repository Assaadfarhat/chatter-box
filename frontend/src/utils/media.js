export function mediaUrl(value) {
  if (!value) return null;
  if (value.startsWith('data:')) return value;
  return `http://localhost:5000/uploads/${value}`;
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}
