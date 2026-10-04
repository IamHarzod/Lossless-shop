/**
 * Chuyển đổi chuỗi tiếng Việt thành slug URL-friendly
 * Ví dụ: "Sennheiser HD 800S - Tai Nghe Chuyên Nghiệp" -> "sennheiser-hd-800s-tai-nghe-chuyen-nghiep"
 */
export function slugify(text: string): string {
  if (!text) return '';

  let slug = text.toLowerCase().trim();

  // Đổi ký tự tiếng Việt có dấu thành không dấu
  slug = slug.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  slug = slug.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  slug = slug.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  slug = slug.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  slug = slug.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  slug = slug.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  slug = slug.replace(/đ/g, 'd');

  // Xóa các ký tự đặc biệt, chỉ giữ lại chữ, số và dấu gạch nối
  slug = slug
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug;
}
