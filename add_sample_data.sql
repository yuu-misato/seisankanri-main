-- めっき種マスターと治具マスターに現実的なサンプルデータを投入するSQL
-- 既存のデータを残しつつ追加します。IDは自動生成です。

-- --- めっき種マスター (platingTypes) ---
INSERT INTO "platingTypes" (id, name, "unitPrice", "costPerLot") VALUES
    (uuid_generate_v4()::text, '亜鉛めっき (三価クロメート)', 12, 3000),
    (uuid_generate_v4()::text, '亜鉛めっき (三価黒色)', 15, 3500),
    (uuid_generate_v4()::text, '無電解ニッケル (中リン)', 45, 8000),
    (uuid_generate_v4()::text, '無電解ニッケル (高リン)', 60, 10000),
    (uuid_generate_v4()::text, '硬質クロムめっき (フラッシュ)', 80, 15000),
    (uuid_generate_v4()::text, '硬質クロムめっき (厚付け)', 150, 25000),
    (uuid_generate_v4()::text, '黒染め (四三酸化鉄皮膜)', 8, 2000),
    (uuid_generate_v4()::text, '白アルマイト (陽極酸化)', 25, 5000),
    (uuid_generate_v4()::text, '黒アルマイト', 30, 6000),
    (uuid_generate_v4()::text, '硬質アルマイト', 50, 12000);

-- --- 治具マスター (jigs) ---
-- totalQuantityは「1回の処理能力(ロット数量)」として設定しています
INSERT INTO "jigs" (id, name, "totalQuantity") VALUES
    (uuid_generate_v4()::text, '汎用引っ掛け治具 (小部品用/64本掛)', 64),
    (uuid_generate_v4()::text, '汎用引っ掛け治具 (中部品用/32本掛)', 32),
    (uuid_generate_v4()::text, '大型製品用フレーム (8本掛)', 8),
    (uuid_generate_v4()::text, 'タコ足治具 (16本掛)', 16),
    (uuid_generate_v4()::text, 'バレル (小/回転めっき)', 500),
    (uuid_generate_v4()::text, 'バレル (中/回転めっき)', 1000),
    (uuid_generate_v4()::text, 'バレル (大/回転めっき)', 3000),
    (uuid_generate_v4()::text, '専用カゴ (黒染め用)', 200),
    (uuid_generate_v4()::text, 'アルマイト用チタン治具 (40本掛)', 40),
    (uuid_generate_v4()::text, '内径保持用マグネット治具', 20);

-- --- 顧客マスター (clients) もついでに数件追加 ---
INSERT INTO "clients" (id, name, "contactPerson") VALUES
    (uuid_generate_v4()::text, '株式会社 昭和製作所', '田中 健一'),
    (uuid_generate_v4()::text, 'メテック工業', '佐藤 浩二'),
    (uuid_generate_v4()::text, '青山自動車部品', '鈴木 一郎'),
    (uuid_generate_v4()::text, '東洋精密機械', '高橋 次郎');
