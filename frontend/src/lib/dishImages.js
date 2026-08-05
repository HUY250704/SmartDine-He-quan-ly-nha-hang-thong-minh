// 100+ high-quality Unsplash restaurant images mapped to Vietnamese dish names
// Matching uses accent-agnostic comparison: "Phở" matches "Pho"

const IMG = (url) => url + "?w=600&q=80&fit=crop";

// deAccent: strips diacritics for flexible matching
const deAccent = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const DISH_MAP = {
  // APPETIZERS
  'Cha gio': [IMG('https://images.unsplash.com/photo-1539735257917-5e5b6e4a1c9c'), IMG('https://images.unsplash.com/photo-1576618148400-f1b45ee96e3b'), IMG('https://images.unsplash.com/photo-1626700051175-6818013e1d4f')],
  'Goi cuon': [IMG('https://images.unsplash.com/photo-1553502678-2f39c9c40c41'), IMG('https://images.unsplash.com/photo-1496116218417-1a781b1c416c')],
  'Nem nuong': [IMG('https://images.unsplash.com/photo-1626700051175-6818013e1d4f')],
  'Banh xeo': [IMG('https://images.unsplash.com/photo-1610366398516-46e1dcdc7e41')],
  'Sup cua': [IMG('https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e')],
  'Ha cao': [IMG('https://images.unsplash.com/photo-1496116218417-1a781b1c416c')],

  // PHO
  'Pho bo': [IMG('https://images.unsplash.com/photo-1519098757744-8c2e8f365e84'), IMG('https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43'), IMG('https://images.unsplash.com/photo-1572449043416-55f6e5f5f9c8')],
  'Pho ga': [IMG('https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43'), IMG('https://images.unsplash.com/photo-1519098757744-8c2e8f365e84')],

  // BUN
  'Bun bo Hue': [IMG('https://images.unsplash.com/photo-1603484390252-4e8c5e67b7db'), IMG('https://images.unsplash.com/photo-1555126634-323283e090fa')],
  'Bun cha': [IMG('https://images.unsplash.com/photo-1572449043416-55f6e5f5f9c8'), IMG('https://images.unsplash.com/photo-1617093727343-374698b1b08d')],
  'Bun thit nuong': [IMG('https://images.unsplash.com/photo-1628801941410-0c40284f5c1c')],

  // MI - HU TIEU
  'Mi xao': [IMG('https://images.unsplash.com/photo-1569718212165-3a8278d5f624'), IMG('https://images.unsplash.com/photo-1612927601601-663894e0e2e4')],
  'Hu tieu': [IMG('https://images.unsplash.com/photo-1555126634-323283e090fa'), IMG('https://images.unsplash.com/photo-1617093727343-374698b1b08d')],
  'Banh canh': [IMG('https://images.unsplash.com/photo-1617093727343-374698b1b08d')],

  // COM
  'Com tam': [IMG('https://images.unsplash.com/photo-1645680827507-9f392edfad23'), IMG('https://images.unsplash.com/photo-1603133872878-684f208fb84b')],
  'Com ga': [IMG('https://images.unsplash.com/photo-1598515214211-89d3c73ae83b'), IMG('https://images.unsplash.com/photo-1645680827507-9f392edfad23')],
  'Com chien': [IMG('https://images.unsplash.com/photo-1603133872878-684f208fb84b'), IMG('https://images.unsplash.com/photo-1645680827507-9f392edfad23')],
  'Com nieu': [IMG('https://images.unsplash.com/photo-1603133872878-684f208fb84b')],

  // MEAT - THIT
  'Bo luc lac': [IMG('https://images.unsplash.com/photo-1558030006-450675393462'), IMG('https://images.unsplash.com/photo-1603073163308-9654c3fb70b5')],
  'Bo kho': [IMG('https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba')],
  'Bo nuong': [IMG('https://images.unsplash.com/photo-1603073163308-9654c3fb70b5')],
  'Ga kho': [IMG('https://images.unsplash.com/photo-1598103442097-8b74394b95c6')],
  'Ga chien': [IMG('https://images.unsplash.com/photo-1598103442097-8b74394b95c6'), IMG('https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec')],
  'Ga nuong': [IMG('https://images.unsplash.com/photo-1598103442097-8b74394b95c6')],
  'Ca kho to': [IMG('https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab'), IMG('https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba')],
  'Thit kho': [IMG('https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba')],
  'Thit kho tau': [IMG('https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba')],
  'Suon nuong': [IMG('https://images.unsplash.com/photo-1544025162-d76694265947'), IMG('https://images.unsplash.com/photo-1555939594-58d7cb561ad1')],
  'Thit nuong': [IMG('https://images.unsplash.com/photo-1555939594-58d7cb561ad1')],
  'Heo quay': [IMG('https://images.unsplash.com/photo-1555939594-58d7cb561ad1')],
  'Vit quay': [IMG('https://images.unsplash.com/photo-1555939594-58d7cb561ad1')],

  // SEAFOOD
  'Tom nuong': [IMG('https://images.unsplash.com/photo-1599416435141-af9aa8188dfe'), IMG('https://images.unsplash.com/photo-1563897539633-7374c276c212')],
  'Tom hap': [IMG('https://images.unsplash.com/photo-1599416435141-af9aa8188dfe')],
  'Tom chien': [IMG('https://images.unsplash.com/photo-1599416435141-af9aa8188dfe')],
  'Muc chien': [IMG('https://images.unsplash.com/photo-1604909052743-94e838986d24'), IMG('https://images.unsplash.com/photo-1563897539633-7374c276c212')],
  'Ca hap': [IMG('https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba')],
  'Lau hai san': [IMG('https://images.unsplash.com/photo-1614313913007-2c142cf782d2'), IMG('https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e')],
  'Lau Thai': [IMG('https://images.unsplash.com/photo-1614313913007-2c142cf782d2')],
  'Lau bo': [IMG('https://images.unsplash.com/photo-1614313913007-2c142cf782d2')],
  'Lau ga': [IMG('https://images.unsplash.com/photo-1614313913007-2c142cf782d2')],

  // SOUPS - CANH
  'Canh chua': [IMG('https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e')],
  'Canh cua': [IMG('https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e')],
  'Sup hai san': [IMG('https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e')],

  // SALAD - GOI
  'Goi': [IMG('https://images.unsplash.com/photo-1540420773420-3366772f4999')],
  'Goi du du': [IMG('https://images.unsplash.com/photo-1540420773420-3366772f4999')],
  'Goi xoai': [IMG('https://images.unsplash.com/photo-1540420773420-3366772f4999')],
  'Salad': [IMG('https://images.unsplash.com/photo-1540420773420-3366772f4999')],
  'Rau xao': [IMG('https://images.unsplash.com/photo-1567375698348-5d9d7ae2e826')],
  'Rau muong xao': [IMG('https://images.unsplash.com/photo-1567375698348-5d9d7ae2e826')],

  // DESSERT
  'Che': [IMG('https://images.unsplash.com/photo-1551024506-0bccd828d307'), IMG('https://images.unsplash.com/photo-1488477181946-6428a0291777')],
  'Che ba mau': [IMG('https://images.unsplash.com/photo-1551024506-0bccd828d307')],
  'Banh flan': [IMG('https://images.unsplash.com/photo-1624353365286-3f8d62daad51'), IMG('https://images.unsplash.com/photo-1488477181946-6428a0291777')],
  'Kem': [IMG('https://images.unsplash.com/photo-1563805042-7684c019e1cb'), IMG('https://images.unsplash.com/photo-1488477181946-6428a0291777'), IMG('https://images.unsplash.com/photo-1551024506-0bccd828d307')],
  'Rau cau': [IMG('https://images.unsplash.com/photo-1551024506-0bccd828d307')],
  'Banh ngot': [IMG('https://images.unsplash.com/photo-1488477181946-6428a0291777')],
  'Trai cay': [IMG('https://images.unsplash.com/photo-1619566636858-adf3ef46400b'), IMG('https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea')],

  // DRINKS
  'Ca phe': [IMG('https://images.unsplash.com/photo-1509042239860-f550ce710b93'), IMG('https://images.unsplash.com/photo-1504630083234-14187a9df0f5'), IMG('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085')],
  'Ca phe sua': [IMG('https://images.unsplash.com/photo-1509042239860-f550ce710b93'), IMG('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085')],
  'Ca phe den': [IMG('https://images.unsplash.com/photo-1509042239860-f550ce710b93')],
  'Tra da': [IMG('https://images.unsplash.com/photo-1544787219-7f47ccb76574')],
  'Tra dao': [IMG('https://images.unsplash.com/photo-1544787219-7f47ccb76574')],
  'Tra sua': [IMG('https://images.unsplash.com/photo-1544787219-7f47ccb76574'), IMG('https://images.unsplash.com/photo-1551024506-0bccd828d307')],
  'Sinh to': [IMG('https://images.unsplash.com/photo-1505252585461-04db1eb84625'), IMG('https://images.unsplash.com/photo-1622597467836-f3285f2131b8')],
  'Nuoc ep': [IMG('https://images.unsplash.com/photo-1622597467836-f3285f2131b8'), IMG('https://images.unsplash.com/photo-1505252585461-04db1eb84625')],
  'Nuoc cam': [IMG('https://images.unsplash.com/photo-1622597467836-f3285f2131b8')],
  'Nuoc chanh': [IMG('https://images.unsplash.com/photo-1622597467836-f3285f2131b8')],
  'Nuoc dua': [IMG('https://images.unsplash.com/photo-1505252585461-04db1eb84625')],
  'Nuoc ngot': [IMG('https://images.unsplash.com/photo-1622483767028-3f66f32aef97')],
  'Coca': [IMG('https://images.unsplash.com/photo-1622483767028-3f66f32aef97')],
  'Pepsi': [IMG('https://images.unsplash.com/photo-1622483767028-3f66f32aef97')],
  'Bia': [IMG('https://images.unsplash.com/photo-1608270586620-248524c67de9'), IMG('https://images.unsplash.com/photo-1535958636474-b021ee887b13')],
  'Ruou vang': [IMG('https://images.unsplash.com/photo-1510812431401-41d2bd2722f3')],

  'default': [IMG('https://images.unsplash.com/photo-1414235077428-338989a2e8c0')],
};

// Hash-based pick: same name always gets same image (consistent per session)
function pick(arr, seed) {
  if (!arr || arr.length === 0) return DISH_MAP["default"][0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return arr[Math.abs(hash) % arr.length];
}

export function getDishImage(dishName) {
  if (!dishName) return DISH_MAP["default"][0];

  // 1. Exact match (key is accent-free)
  const an = deAccent(dishName);
  if (DISH_MAP[an]) return pick(DISH_MAP[an], dishName);

  // 2. Partial match: dish name contains key OR key contains dish name
  for (const [key, urls] of Object.entries(DISH_MAP)) {
    if (key === "default") continue;
    if (an.includes(key) || key.includes(an)) return pick(urls, dishName);
  }

  // 3. Word-by-word: check if any word in dish name matches a key
  const words = an.split(/\s+/);
  for (const w of words) {
    if (w.length < 2) continue;
    if (DISH_MAP[w]) return pick(DISH_MAP[w], dishName);
    for (const [key, urls] of Object.entries(DISH_MAP)) {
      if (key === "default") continue;
      if (w.includes(key) || key.includes(w)) return pick(urls, dishName);
    }
  }

  // 4. Category fallback by keyword
  const FALLBACK = {
    noodle: IMG('https://images.unsplash.com/photo-1555126634-323283e090fa'),
    rice: IMG('https://images.unsplash.com/photo-1645680827507-9f392edfad23'),
    chicken: IMG('https://images.unsplash.com/photo-1598103442097-8b74394b95c6'),
    beef: IMG('https://images.unsplash.com/photo-1558030006-450675393462'),
    seafood: IMG('https://images.unsplash.com/photo-1563897539633-7374c276c212'),
    grill: IMG('https://images.unsplash.com/photo-1555939594-58d7cb561ad1'),
    dessert: IMG('https://images.unsplash.com/photo-1488477181946-6428a0291777'),
    drink: IMG('https://images.unsplash.com/photo-1544145945-f90425340c7e'),
    soup: IMG('https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e'),
    salad: IMG('https://images.unsplash.com/photo-1540420773420-3366772f4999'),
  };
  const cat =
    /pho|bun|mi|hu tieu|banh canh/i.test(an) ? 'noodle'
    : /com|rice/i.test(an) ? 'rice'
    : /ga|chicken/i.test(an) ? 'chicken'
    : /bo|beef/i.test(an) ? 'beef'
    : /tom|muc|ca|hai san|seafood/i.test(an) ? 'seafood'
    : /nuong|grill/i.test(an) ? 'grill'
    : /che|banh|kem|trang|dessert|rau cau|trai cay/i.test(an) ? 'dessert'
    : /ca phe|tra|sinh to|nuoc|bia|ruou|drink|coca|pepsi/i.test(an) ? 'drink'
    : /canh|sup|soup|lau/i.test(an) ? 'soup'
    : /goi|salad|rau/i.test(an) ? 'salad'
    : null;
  if (cat) return FALLBACK[cat];

  return DISH_MAP["default"][0];
}
