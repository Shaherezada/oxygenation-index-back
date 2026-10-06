// авторизации пока нет: во всех методах работает один и тот же врач из таблицы doctors
const CURRENT_DOCTOR_ID = 1;

// функция-singleton: единственное место, откуда методы узнают текущего врача
export function getCurrentDoctorId(): number {
  return CURRENT_DOCTOR_ID;
}
