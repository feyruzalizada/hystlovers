/**
 * az/en/ru versions of the content the live shop only ever had in English.
 * `was` lists earlier seeded values that may be replaced as well.
 */
export type Text = { az: string; en: string; ru: string; was?: string[] };
export type Paragraphs = { az: string[]; en: string[]; ru: string[]; was?: string[][] };

export const categoryNames: Text[] = [
  { en: "Sets", az: "Dəstlər", ru: "Комплекты" },
  { en: "Single Pieces", az: "Tək məhsullar", ru: "Отдельные вещи" },
  { en: "T-Shirts", az: "Futbolkalar", ru: "Футболки" },
  { en: "Tank Tops", az: "Maykalar", ru: "Майки" },
  { en: "Sweatshirts", az: "Svitşotlar", ru: "Свитшоты" },
  { en: "Shorts", az: "Şortlar", ru: "Шорты" },
  { en: "Accessories", az: "Aksesuarlar", ru: "Аксессуары" },
];

export const colorNames: Text[] = [
  { en: "Brown", az: "Qəhvəyi", ru: "Коричневый" },
  { en: "Mint", az: "Nanə", ru: "Мятный" },
  { en: "PASTEL", az: "Pastel", ru: "Пастельный" },
  { en: "Black", az: "Qara", ru: "Чёрный" },
  { en: "Blue", az: "Mavi", ru: "Голубой" },
  { en: "Gray", az: "Boz", ru: "Серый" },
];

export const fabrics: Text[] = [
  { en: "Cotton", az: "Pambıq", ru: "Хлопок" },
  { en: "Modal", az: "Modal", ru: "Модал" },
];

/** Compositions double as product features, so both are looked up here. */
export const productPhrases: Text[] = [
  { en: "100% cotton", az: "100% pambıq", ru: "100% хлопок" },
  { en: "48% modal, 48% cotton, 4% elastane", az: "48% modal, 48% pambıq, 4% elastan", ru: "48% модал, 48% хлопок, 4% эластан" },
  { en: "95% modal, 5% elastane", az: "95% modal, 5% elastan", ru: "95% модал, 5% эластан" },
  { en: "80% cotton, 20% polyester", az: "80% pambıq, 20% poliester", ru: "80% хлопок, 20% полиэстер" },
  { en: "Soft, breathable fabric", az: "Yumşaq, nəfəs alan parça", ru: "Мягкая, дышащая ткань" },
  {
    en: "Model is 1.75m tall and wears size XS/S",
    az: "Modelin boyu 1,75 m-dir, əynində XS/S ölçüsüdür",
    ru: "Рост модели 1,75 м, на ней размер XS/S",
  },
  { en: "Consciously made in Türkiye", az: "Türkiyədə şüurlu şəkildə istehsal olunub", ru: "Осознанно произведено в Турции" },
];

const DESCRIPTION =
  /^From the (\S+) series, where carefully selected (\S+) fabric meets an elegant design language\. Crafted for all-day comfort and a timeless silhouette\.$/;

const fabricIn = {
  az: { Cotton: "pambıq", Modal: "modal" } as Record<string, string>,
  ru: { Cotton: "хлопка", Modal: "модала" } as Record<string, string>,
};

/** Every seeded description follows one template; anything else is left alone. */
export function productDescription(en: string): Text | null {
  const match = DESCRIPTION.exec(en);
  if (!match) return null;
  const [, series, fabric] = match;
  if (!fabricIn.az[fabric]) return null;
  return {
    en,
    az: `${series} seriyasından: diqqətlə seçilmiş ${fabricIn.az[fabric]} parça zərif dizayn dili ilə birləşir. Bütün gün rahatlıq və zamansız siluet üçün yaradılıb.`,
    ru: `Из серии ${series}: тщательно отобранная ткань из ${fabricIn.ru[fabric]} в элегантном дизайне. Создано для комфорта на весь день и вневременного силуэта.`,
  };
}

export const workingHours: Text = { en: "Weekdays 9 AM — 6 PM", az: "Həftəiçi 09:00 — 18:00", ru: "Будни 9:00 — 18:00" };

export const slideTexts: Text[] = [{ en: "Order Now", az: "İndi sifariş et", ru: "Заказать сейчас" }];

export const pages: Record<string, { title: Text; body: Paragraphs }> = {
  "about-us": {
    title: { en: "About Us", az: "Haqqımızda", ru: "О нас" },
    body: {
      en: [
        "A timeless world where carefully selected fabrics meet an elegant design language, and quality blends with simplicity.",
        "Our brand is built on quiet elegance, conscious production and a deep respect for detail. Unnoticed touches of luxury, thoughtful manufacturing and devotion to craftsmanship are at the heart of every piece we make.",
        "Hystlovers is not seasonal fashion — it is a lifestyle you own. Our pieces are designed not for trends, but to stay with you for years.",
      ],
      az: [
        "Diqqətlə seçilmiş parçaların zərif dizayn dili ilə qovuşduğu, keyfiyyətin sadəliklə birləşdiyi zamansız bir dünya.",
        "Brendimiz sakit zəriflik, şüurlu istehsal və detallara dərin hörmət üzərində qurulub. Gözə çarpmayan lüks toxunuşları, düşünülmüş istehsal və ustalığa sədaqət yaratdığımız hər məhsulun əsasındadır.",
        "Hystlovers mövsümi dəb deyil — sizə məxsus bir həyat tərzidir. Məhsullarımız trendlər üçün deyil, illərlə sizinlə qalmaq üçün yaradılır.",
      ],
      ru: [
        "Вневременной мир, где тщательно выбранные ткани встречаются со сдержанным языком дизайна, а качество — с простотой.",
        "Наш бренд построен на спокойной элегантности, осознанном производстве и глубоком уважении к деталям. Незаметные штрихи роскоши, продуманное производство и преданность мастерству лежат в основе каждой нашей вещи.",
        "Hystlovers — не сезонная мода, а образ жизни, который принадлежит вам. Наши вещи создаются не ради трендов, а чтобы оставаться с вами годами.",
      ],
    },
  },
  careers: {
    title: { en: "Careers", az: "Karyera", ru: "Карьера" },
    body: {
      en: [
        "At Hystlovers, we value quiet elegance, conscious production and a deep respect for detail.",
        "To apply for open positions, send your resume to careers@hystlovers.com.",
      ],
      az: [
        "Hystlovers-də biz sakit zərifliyə, şüurlu istehsala və detallara dərin hörmətə dəyər veririk.",
        "Açıq vakansiyalara müraciət etmək üçün CV-nizi careers@hystlovers.com ünvanına göndərin.",
      ],
      ru: [
        "В Hystlovers мы ценим спокойную элегантность, осознанное производство и глубокое уважение к деталям.",
        "Чтобы откликнуться на открытые вакансии, отправьте резюме на careers@hystlovers.com.",
      ],
    },
  },
  "care-instructions": {
    title: { en: "Washing & Care Instructions", az: "Yuma və qulluq qaydaları", ru: "Стирка и уход" },
    body: {
      en: [
        "To extend the life of your garments, wash at 30 degrees on a delicate cycle with similar colors.",
        "Do not tumble dry. Iron inside out at low temperature.",
        "Lay viscose and modal pieces flat to dry instead of hanging them.",
      ],
      az: [
        "Geyimlərinizin ömrünü uzatmaq üçün onları 30 dərəcədə, zərif rejimdə, oxşar rəngli əşyalarla birlikdə yuyun.",
        "Quruducuda qurutmayın. Tərs üzündən, aşağı temperaturda ütüləyin.",
        "Viskoza və modal məhsulları asmaq əvəzinə düz səthə sərib qurudun.",
      ],
      ru: [
        "Чтобы продлить жизнь ваших вещей, стирайте их при 30 градусах в деликатном режиме вместе с вещами похожих цветов.",
        "Не сушите в сушильной машине. Гладьте с изнанки при низкой температуре.",
        "Вещи из вискозы и модала сушите в расправленном виде на ровной поверхности, а не на вешалке.",
      ],
    },
  },
  "order-tracking": {
    title: { en: "Order Tracking", az: "Sifarişin izlənməsi", ru: "Отслеживание заказа" },
    body: {
      en: [
        "Once your order has shipped, your tracking number will be sent by e-mail and SMS.",
        "You can follow your shipment on the carrier's website using your tracking number.",
      ],
      az: [
        "Sifarişiniz göndərildikdən sonra izləmə nömrəsi e-poçt və SMS ilə sizə göndəriləcək.",
        "Bu nömrə ilə göndərişinizi daşıyıcı şirkətin saytında izləyə bilərsiniz.",
      ],
      ru: [
        "После отправки заказа номер для отслеживания придёт вам по e-mail и SMS.",
        "По этому номеру посылку можно отслеживать на сайте службы доставки.",
      ],
      // The import kept the HTML entity from the source page.
      was: [
        [
          "Once your order has shipped, your tracking number will be sent by e-mail and SMS.",
          "You can follow your shipment on the carrier&#039;s website using your tracking number.",
        ],
      ],
    },
  },
  "shipping-and-delivery": {
    title: { en: "Shipping & Delivery", az: "Çatdırılma", ru: "Доставка" },
    body: {
      en: [
        "Orders are shipped within 1-3 business days.",
        "Shipping is free on orders over 100 ₼.",
        "Delivery takes 1-4 business days depending on the carrier.",
      ],
      az: [
        "Sifarişlər 1-3 iş günü ərzində göndərilir.",
        "100 ₼-dən yuxarı sifarişlərdə çatdırılma pulsuzdur.",
        "Çatdırılma daşıyıcı şirkətdən asılı olaraq 1-4 iş günü çəkir.",
      ],
      ru: [
        "Заказы отправляются в течение 1–3 рабочих дней.",
        "Доставка бесплатна при заказе от 100 ₼.",
        "Доставка занимает 1–4 рабочих дня в зависимости от службы доставки.",
      ],
      // The live page still quotes the Turkish lira threshold of the template it came from.
      was: [
        [
          "Orders are shipped within 1-3 business days.",
          "Shipping is free on orders over 2,500.00TL.",
          "Delivery takes 1-4 business days depending on the carrier.",
        ],
      ],
    },
  },
  "return-policy": {
    title: { en: "Return Policy", az: "Geri qaytarma qaydaları", ru: "Условия возврата" },
    body: {
      en: [
        "You may return your items within 14 days of delivery.",
        "Returned items must be unused with all tags attached.",
        "To request a return, please reach out via our contact page.",
      ],
      az: [
        "Məhsulları çatdırılmadan sonra 14 gün ərzində geri qaytara bilərsiniz.",
        "Geri qaytarılan məhsullar istifadə olunmamış və bütün etiketləri üzərində olmalıdır.",
        "Geri qaytarma üçün əlaqə səhifəmiz vasitəsilə bizə yazın.",
      ],
      ru: [
        "Вы можете вернуть товары в течение 14 дней после доставки.",
        "Возвращаемые товары должны быть неношеными и со всеми бирками.",
        "Чтобы оформить возврат, напишите нам через страницу контактов.",
      ],
    },
  },
  "privacy-policy": {
    title: { en: "Privacy Policy", az: "Məxfilik siyasəti", ru: "Политика конфиденциальности" },
    body: {
      en: [
        "Your personal data is processed solely for order fulfilment, in accordance with applicable data protection law.",
        "Your data is never shared with third parties and is deleted at the end of the legal retention period.",
      ],
      az: [
        "Şəxsi məlumatlarınız yalnız sifarişin icrası üçün, qüvvədə olan məlumatların qorunması qanunvericiliyinə uyğun olaraq emal edilir.",
        "Məlumatlarınız heç vaxt üçüncü şəxslərlə paylaşılmır və qanuni saxlama müddəti bitdikdən sonra silinir.",
      ],
      ru: [
        "Ваши персональные данные обрабатываются исключительно для выполнения заказа в соответствии с действующим законодательством о защите данных.",
        "Ваши данные никогда не передаются третьим лицам и удаляются по истечении установленного законом срока хранения.",
      ],
    },
  },
  "terms-of-sale": {
    title: { en: "Terms of Sale", az: "Satış şərtləri", ru: "Условия продажи" },
    body: {
      en: [
        "This agreement sets out the terms of the sales relationship established electronically between the seller and the buyer.",
        "The consumer may exercise their right of withdrawal and return the purchased item within 14 days.",
      ],
      az: [
        "Bu müqavilə satıcı ilə alıcı arasında elektron qaydada yaranan satış münasibətlərinin şərtlərini müəyyən edir.",
        "İstehlakçı 14 gün ərzində imtina hüququndan istifadə edərək aldığı məhsulu geri qaytara bilər.",
      ],
      ru: [
        "Настоящее соглашение определяет условия отношений купли-продажи, возникающих между продавцом и покупателем в электронной форме.",
        "Покупатель вправе в течение 14 дней отказаться от покупки и вернуть приобретённый товар.",
      ],
    },
  },
};
