-- MySQL dump 10.13  Distrib 8.0.28, for Win64 (x86_64)
--
-- Host: localhost    Database: essay_scoring
-- ------------------------------------------------------
-- Server version	8.0.28

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `essay_scoring`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `essay_scoring` /*!40100 DEFAULT CHARACTER SET utf8 */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `essay_scoring`;

--
-- Table structure for table `class_join_requests`
--

DROP TABLE IF EXISTS `class_join_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_join_requests` (
  `id` varchar(36) NOT NULL,
  `class_id` varchar(36) NOT NULL,
  `student_username` varchar(100) NOT NULL,
  `status` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `class_id` (`class_id`),
  KEY `student_username` (`student_username`),
  CONSTRAINT `class_join_requests_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `class_join_requests_ibfk_2` FOREIGN KEY (`student_username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_join_requests`
--

LOCK TABLES `class_join_requests` WRITE;
/*!40000 ALTER TABLE `class_join_requests` DISABLE KEYS */;
INSERT INTO `class_join_requests` VALUES ('4c986cc1-75f7-4996-8426-55d9e3b2ba79','577e8819-8d95-4369-aedf-08d55077d3cf','3221316102','approved','2026-01-18 15:39:44'),('657ccecc-2e73-45ca-a55d-7ac10a929bbf','f67133f6-3f73-4430-9150-58c05bc8136b','3221316107','approved','2026-01-17 08:41:46'),('ad151da9-215b-4677-9c16-a2e0942bb19a','f67133f6-3f73-4430-9150-58c05bc8136b','3221316107','approved','2026-01-17 08:42:49');
/*!40000 ALTER TABLE `class_join_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `class_members`
--

DROP TABLE IF EXISTS `class_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_members` (
  `class_id` varchar(36) NOT NULL,
  `student_username` varchar(100) NOT NULL,
  `group_name` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`class_id`,`student_username`),
  KEY `student_username` (`student_username`),
  CONSTRAINT `class_members_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `class_members_ibfk_2` FOREIGN KEY (`student_username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_members`
--

LOCK TABLES `class_members` WRITE;
/*!40000 ALTER TABLE `class_members` DISABLE KEYS */;
INSERT INTO `class_members` VALUES ('577e8819-8d95-4369-aedf-08d55077d3cf','3221316102',NULL,'2026-01-18 15:39:50'),('f67133f6-3f73-4430-9150-58c05bc8136b','3221316107','','2026-01-17 08:42:57');
/*!40000 ALTER TABLE `class_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `grade` varchar(50) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `teacher_username` varchar(100) NOT NULL,
  `invite_code` varchar(32) NOT NULL,
  `require_approval` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invite_code` (`invite_code`),
  KEY `teacher_username` (`teacher_username`),
  CONSTRAINT `classes_ibfk_1` FOREIGN KEY (`teacher_username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES ('577e8819-8d95-4369-aedf-08d55077d3cf','大数据','初中一年级','语文','3221316111','O571NLEs',1,'2026-01-17 08:50:41'),('f67133f6-3f73-4430-9150-58c05bc8136b','大数据','初中一年级','英语','3221316111','Y7ep3gYr',1,'2026-01-17 08:38:45');
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `essays`
--

DROP TABLE IF EXISTS `essays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `essays` (
  `id` varchar(36) NOT NULL,
  `username` varchar(100) NOT NULL,
  `topic` text NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `original_content` longtext NOT NULL,
  `score` int DEFAULT NULL,
  `feedback` json DEFAULT NULL,
  `revised_content` longtext,
  `timestamp` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `username` (`username`),
  CONSTRAINT `essays_ibfk_1` FOREIGN KEY (`username`) REFERENCES `users` (`username`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `essays`
--

LOCK TABLES `essays` WRITE;
/*!40000 ALTER TABLE `essays` DISABLE KEYS */;
INSERT INTO `essays` VALUES ('57aa7d07-4111-49fd-97a0-4c9be51963e8','3221316107','23.阅读下面的材料,根据要求写作。(60分)\n　　近来,社交媒体上刮起“敬自己”之风:有人敬只有三分钟热度的自己,没有坚持却愿意为热爱买单;有人敬倔强的自己,被生活扇了耳光却站得更直;有人敬不易的自己,没成大器却已花光所有力气……有人认为这是人们对自我价值的主动审视,也有人认为这不过是对现实的无奈妥协。\n　　这引发了你怎样的联想与思考?请写一篇文章。','敬己以微光，照路破荒芜','“敬自己” 的热潮席卷互联网，有人敬在平凡中创造奇迹的自己，亦有人视之为对现实的妥协。在我看来，这恰如罗曼・罗兰所言的英雄主义 ——“看清生活的本质后，依然热爱它”。它让平凡个体在自我认可中，汇聚成照亮人生的微光。\n敬自己，是接纳不完美的自己。《浪浪山小妖怪》里，小猪妖拒绝助恶，以孤勇力战黄眉老怪，终获村民立祠纪念；“绝壁凿渠” 的黄大发，携村民耗时三十载，以愚公之志改写山村宿命；“敦煌女儿” 樊锦诗，扎根大漠五十七载，在风沙中守护莫高窟的千年文脉。反观当下，许多人陷入 “要么极致要么放弃” 的极端，将 “不完美” 等同于 “失败”，却忘了每一次短暂而热烈的投入，都是对兴趣的主动试探。为 “三分钟热度” 正名，不是纵容半途而废，而是承认探索过程的价值 —— 要想求得完美，先要完成，方能收获途中的馈赠。\n敬自己，是对抗困境的顽强。苏轼一生屡遭贬谪，从京城才子沦为黄州团练副使，却在 “竹杖芒鞋轻胜马” 的豁达中，写下 “大江东去” 的千古绝唱；杨绛先生在动荡岁月中痛失至亲，饱受磨难，却以 “人生最曼妙的风景，竟是内心淡定与从容” 的通透，完成《我们仨》的深情回望。他们敬的，是狂风骤雨中不肯弯腰的自己，正如沙漠里挺立的白杨，即便根系在干旱中挣扎，也始终保持向上生长的姿态。这份顽强，为生命注入胡杨般的韧性，让我们在人生低谷中守住精神高地。\n敬自己，是认可平凡的清醒。“感动中国” 人物庞众望，在母亲身患重疾的困境中平衡生活与学习，于苦难中淬炼坚韧，逆袭成河北理科状元；张桂梅校长扎根大山数十载，未成为聚光灯下的 “大人物”，却用布满膏药的手，托起万千女孩的求学梦。人生的轨道从不由世俗标尺定义，每一份脚踏实地的努力，都值得肯定。\n敬自己从不是对现实的妥协，而是对生命的珍视；不是自我安慰的 “心灵鸡汤”，而是为自己赋能的铠甲。当代青年当以理性看待这股热潮，摒弃躺平、拒绝纵容，方能敬微光于己身，照前路以破荒芜。',52,'[{\"type\": \"优点\", \"detail\": [\"文章结构清晰，逻辑严谨，能够紧扣主题进行论述。\", \"引用了多个具体事例和名言，增强了文章的说服力。\", \"语言表达流畅，有较强的感染力。\"]}, {\"type\": \"不足\", \"detail\": [\"部分段落内容较为冗长，可以适当精简。\", \"在论证“敬自己”不是对现实的妥协时，可以进一步深入分析，增强论点的力度。\", \"结尾部分稍显仓促，可以更加明确地总结全文，提升文章的整体性。\"]}, {\"type\": \"建议\", \"detail\": [\"尝试将一些长句拆分成短句，使文章更易读。\", \"增加对“敬自己”的多角度解读，丰富文章内容。\", \"在结尾部分加入对当代青年的具体行动建议，提升文章的实用性。\"]}]','“敬自己”的热潮席卷互联网，有人敬在平凡中创造奇迹的自己，亦有人视之为对现实的妥协。在我看来，这恰如罗曼・罗兰所言的英雄主义——“看清生活的本质后，依然热爱它”。它让平凡个体在自我认可中，汇聚成照亮人生的微光。\\n敬自己，是接纳不完美的自己。《浪浪山小妖怪》里的小猪妖拒绝助恶，以孤勇力战黄眉老怪，终获村民立祠纪念；“绝壁凿渠”的黄大发，携村民耗时三十载，以愚公之志改写山村宿命；“敦煌女儿”樊锦诗扎根大漠五十七载，在风沙中守护莫高窟的千年文脉。反观当下，许多人陷入“要么极致要么放弃”的极端，将“不完美”等同于“失败”，却忘了每一次短暂而热烈的投入，都是对兴趣的主动试探。为“三分钟热度”正名，不是纵容半途而废，而是承认探索过程的价值——要想求得完美，先要完成，方能收获途中的馈赠。\\n敬自己，是对抗困境的顽强。苏轼一生屡遭贬谪，从京城才子沦为黄州团练副使，却在“竹杖芒鞋轻胜马”的豁达中，写下“大江东去”的千古绝唱；杨绛先生在动荡岁月中痛失至亲，饱受磨难，却以“人生最曼妙的风景，竟是内心淡定与从容”的通透，完成《我们仨》的深情回望。他们敬的，是狂风骤雨中不肯弯腰的自己，正如沙漠里挺立的白杨，即便根系在干旱中挣扎，也始终保持向上生长的姿态。这份顽强，为生命注入胡杨般的韧性，让我们在人生低谷中守住精神高地。\\n敬自己，是认可平凡的清醒。“感动中国”人物庞众望，在母亲身患重疾的困境中平衡生活与学习，于苦难中淬炼坚韧，逆袭成河北理科状元；张桂梅校长扎根大山数十载，未成为聚光灯下的“大人物”，却用布满膏药的手，托起万千女孩的求学梦。人生的轨道从不由世俗标尺定义，每一份脚踏实地的努力，都值得肯定。\\n敬自己从不是对现实的妥协，而是对生命的珍视；不是自我安慰的“心灵鸡汤”，而是为自己赋能的铠甲。当代青年当以理性看待这股热潮，摒弃躺平、拒绝纵容，方能敬微光于己身，照前路以破荒芜。',1768636157224),('831b6d01-133f-466e-8a39-b08771f86b2f','3221316107','23.阅读下面的材料,根据要求写作。(60分)\n　　近来,社交媒体上刮起“敬自己”之风:有人敬只有三分钟热度的自己,没有坚持却愿意为热爱买单;有人敬倔强的自己,被生活扇了耳光却站得更直;有人敬不易的自己,没成大器却已花光所有力气……有人认为这是人们对自我价值的主动审视,也有人认为这不过是对现实的无奈妥协。\n　　这引发了你怎样的联想与思考?请写一篇文章。','敬己以微光，照路破荒芜','“敬自己” 的热潮席卷互联网，有人敬在平凡中创造奇迹的自己，亦有人视之为对现实的妥协。在我看来，这恰如罗曼・罗兰所说的英雄主义 ——“看清生活的本质后，依然热爱它”。它让平凡个体在自我认可中，汇聚成照亮人生的微光。\n敬自己，是接纳不完美的自己。《浪浪山小妖怪》中，小猪妖拒绝助恶，以孤勇力战黄眉老怪，终获村民立祠纪念；恰如 “绝壁凿渠” 的黄大发，携村民耗时三十载，以愚公之志改写山村宿命；似 “敦煌女儿” 樊锦诗，一身扎根大漠五十七载，在风沙中守护莫高窟的千年文脉。反观当下，许多人陷入 “要么极致要么放弃” 的极端，将 “不完美” 等同于 “失败”，却忘了每一次短暂而热烈的投入，都是对自己兴趣的主动试探。为那些 “三分钟热度” 正名，不是纵容半途而废，而是承认每一次探索过程的价值 —— 要想求得完美，先要完成，才能收获探索途中的所有馈赠。\n敬自己，是对抗困境的顽强。苏轼一生屡遭贬谪，从京城才子沦为黄州团练副使，却在 “竹杖芒鞋轻胜马” 的豁达中，写下 “大江东去” 的千古绝唱；杨绛先生在动荡岁月中失去至亲，饱受磨难，却以 “我们曾如此渴望命运的波澜，到最后才发现，人生最曼妙的风景，竟是内心的淡定与从容” 的通透，完成《我们仨》的深情回望。他们敬的，是那个在狂风骤雨中不肯弯腰的自己。正如沙漠中挺立的白杨树，即使根系在干旱中挣扎，也始终保持向上生长的姿态。致敬自己的顽强，就是为生命注入胡杨般的韧性，让我们在人生低谷中守住精神的高地。\n敬自己，是以认可平凡的清醒。“感动中国” 人物庞众望，在母亲身患重疾的情况下，平衡生活与学习，在苦难中淬炼出乐观坚韧，最终以高分逆袭成为河北理科状元；张桂梅校长数十年扎根大山，未能成为聚光灯下的 “大人物”，却用布满膏药的手，托起万千女孩的求学梦。他们敬的，正是在平凡中拼尽全力的自己。人生的轨道不由世俗的标尺定义，每一份脚踏实地的努力，每一次拼尽全力的付出，都值得肯定。敬自己的不易，便是在平凡中窥见伟大，让我们在追逐名利的洪流中，守住内心的平和与坚定。\n敬自己，不是对现实的妥协，而是对生命的珍视；不是安慰自己的 “心灵鸡汤”，而是为自己赋能的铠甲。当我们学会接纳那个不完美、敢抗争、肯努力的自己，便会在自我接纳中积蓄力量，在自我认可中找准方向。\n当代青年需以理性看待 “敬自己” 的热潮，保持清醒认知，摒弃躺平；以敬畏之心砥砺成长，拒绝纵容。唯有如此，方能敬微光于己身，照前路以破荒芜。\n\n\n\n\n\n\n按这个文章大体不变写到800字\n敬己以微光，照路破荒芜\n“敬自己” 的热潮席卷互联网，有人敬在平凡中创造奇迹的自己，亦有人视之为对现实的妥协。在我看来，这恰如罗曼・罗兰所言的英雄主义 ——“看清生活的本质后，依然热爱它”。它让平凡个体在自我认可中，汇聚成照亮人生的微光。\n敬自己，是接纳不完美的自己。《浪浪山小妖怪》里，小猪妖拒绝助恶，以孤勇力战黄眉老怪，终获村民立祠纪念；“绝壁凿渠” 的黄大发，携村民耗时三十载，以愚公之志改写山村宿命；“敦煌女儿” 樊锦诗，扎根大漠五十七载，在风沙中守护莫高窟的千年文脉。反观当下，许多人陷入 “要么极致要么放弃” 的极端，将 “不完美” 等同于 “失败”，却忘了每一次短暂而热烈的投入，都是对兴趣的主动试探。为 “三分钟热度” 正名，不是纵容半途而废，而是承认探索过程的价值 —— 要想求得完美，先要完成，方能收获途中的馈赠。\n敬自己，是对抗困境的顽强。苏轼一生屡遭贬谪，从京城才子沦为黄州团练副使，却在 “竹杖芒鞋轻胜马” 的豁达中，写下 “大江东去” 的千古绝唱；杨绛先生在动荡岁月中痛失至亲，饱受磨难，却以 “人生最曼妙的风景，竟是内心淡定与从容” 的通透，完成《我们仨》的深情回望。他们敬的，是狂风骤雨中不肯弯腰的自己，正如沙漠里挺立的白杨，即便根系在干旱中挣扎，也始终保持向上生长的姿态。这份顽强，为生命注入胡杨般的韧性，让我们在人生低谷中守住精神高地。\n敬自己，是认可平凡的清醒。“感动中国” 人物庞众望，在母亲身患重疾的困境中平衡生活与学习，于苦难中淬炼坚韧，逆袭成河北理科状元；张桂梅校长扎根大山数十载，未成为聚光灯下的 “大人物”，却用布满膏药的手，托起万千女孩的求学梦。人生的轨道从不由世俗标尺定义，每一份脚踏实地的努力，都值得肯定。\n敬自己从不是对现实的妥协，而是对生命的珍视；不是自我安慰的 “心灵鸡汤”，而是为自己赋能的铠甲。当代青年当以理性看待这股热潮，摒弃躺平、拒绝纵容，方能敬微光于己身，照前路以破荒芜。',52,'[{\"type\": \"优点\", \"detail\": [\"文章结构清晰，逻辑性强，分为三个主要部分来阐述“敬自己”的不同层面。\", \"引用了多个具体的人物和事例，增强了文章的说服力。\", \"语言表达流畅，情感真挚，能够引起读者共鸣。\"]}, {\"type\": \"不足\", \"detail\": [\"部分段落内容稍显冗长，可以适当精简，使文章更加紧凑。\", \"个别句子的衔接不够自然，影响了整体的连贯性。\", \"在论证过程中，对“敬自己”是妥协还是自我审视的观点论述不够深入。\"]}, {\"type\": \"建议\", \"detail\": [\"进一步精简段落，确保每个段落的主题明确，避免冗余。\", \"加强句子之间的衔接，使文章更加连贯。\", \"可以在结尾部分进一步深化对“敬自己”这一现象的思考，提出更具深度的观点。\"]}]','敬己以微光，照路破荒芜 “敬自己” 的热潮席卷互联网，有人敬在平凡中创造奇迹的自己，亦有人视之为对现实的妥协。在我看来，这恰如罗曼・罗兰所言的英雄主义 ——“看清生活的本质后，依然热爱它”。它让平凡个体在自我认可中，汇聚成照亮人生的微光。 敬自己，是接纳不完美的自己。《浪浪山小妖怪》里，小猪妖拒绝助恶，以孤勇力战黄眉老怪，终获村民立祠纪念；“绝壁凿渠” 的黄大发，携村民耗时三十载，以愚公之志改写山村宿命；“敦煌女儿” 樊锦诗，扎根大漠五十七载，在风沙中守护莫高窟的千年文脉。反观当下，许多人陷入 “要么极致要么放弃” 的极端，将 “不完美” 等同于 “失败”，却忘了每一次短暂而热烈的投入，都是对兴趣的主动试探。为 “三分钟热度” 正名，不是纵容半途而废，而是承认探索过程的价值 —— 要想求得完美，先要完成，方能收获途中的馈赠。 敬自己，是对抗困境的顽强。苏轼一生屡遭贬谪，从京城才子沦为黄州团练副使，却在 “竹杖芒鞋轻胜马” 的豁达中，写下 “大江东去” 的千古绝唱；杨绛先生在动荡岁月中痛失至亲，饱受磨难，却以 “人生最曼妙的风景，竟是内心淡定与从容” 的通透，完成《我们仨》的深情回望。他们敬的，是狂风骤雨中不肯弯腰的自己，正如沙漠里挺立的白杨，即便根系在干旱中挣扎，也始终保持向上生长的姿态。这份顽强，为生命注入胡杨般的韧性，让我们在人生低谷中守住精神高地。 敬自己，是认可平凡的清醒。“感动中国” 人物庞众望，在母亲身患重疾的困境中平衡生活与学习，于苦难中淬炼坚韧，逆袭成河北理科状元；张桂梅校长扎根大山数十载，未成为聚光灯下的 “大人物”，却用布满膏药的手，托起万千女孩的求学梦。人生的轨道从不由世俗标尺定义，每一份脚踏实地的努力，都值得肯定。 敬自己从不是对现实的妥协，而是对生命的珍视；不是自我安慰的 “心灵鸡汤”，而是为自己赋能的铠甲。当代青年当以理性看待这股热潮，摒弃躺平、拒绝纵容，方能敬微光于己身，照前路以破荒芜。',1768636129783);
/*!40000 ALTER TABLE `essays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invite_bind`
--

DROP TABLE IF EXISTS `invite_bind`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invite_bind` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invitee_username` varchar(100) NOT NULL,
  `inviter_username` varchar(100) NOT NULL,
  `code` varchar(32) NOT NULL,
  `bound_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invitee_username` (`invitee_username`),
  KEY `inviter_username` (`inviter_username`),
  CONSTRAINT `invite_bind_ibfk_1` FOREIGN KEY (`invitee_username`) REFERENCES `users` (`username`),
  CONSTRAINT `invite_bind_ibfk_2` FOREIGN KEY (`inviter_username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invite_bind`
--

LOCK TABLES `invite_bind` WRITE;
/*!40000 ALTER TABLE `invite_bind` DISABLE KEYS */;
INSERT INTO `invite_bind` VALUES (1,'3221316103','3221316102','QJaQYcYn','2026-01-18 14:52:01');
/*!40000 ALTER TABLE `invite_bind` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invite_code`
--

DROP TABLE IF EXISTS `invite_code`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invite_code` (
  `id` int NOT NULL AUTO_INCREMENT,
  `inviter_username` varchar(100) NOT NULL,
  `code` varchar(32) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `inviter_username` (`inviter_username`),
  CONSTRAINT `invite_code_ibfk_1` FOREIGN KEY (`inviter_username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invite_code`
--

LOCK TABLES `invite_code` WRITE;
/*!40000 ALTER TABLE `invite_code` DISABLE KEYS */;
INSERT INTO `invite_code` VALUES (1,'3221316107','yR5psdN5','2026-01-18 07:17:06',NULL),(2,'3221316102','I6cHGA7H','2026-01-18 07:22:12',NULL);
/*!40000 ALTER TABLE `invite_code` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_requests`
--

DROP TABLE IF EXISTS `password_reset_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `code` varchar(20) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_password_reset_user` (`username`),
  CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_requests`
--

LOCK TABLES `password_reset_requests` WRITE;
/*!40000 ALTER TABLE `password_reset_requests` DISABLE KEYS */;
INSERT INTO `password_reset_requests` VALUES (1,'3221316103',NULL,'760451','2026-01-29 06:12:41','2026-01-29 06:02:53','2026-01-29 06:02:41');
/*!40000 ALTER TABLE `password_reset_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phone_verifications`
--

DROP TABLE IF EXISTS `phone_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phone_verifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `phone` varchar(32) NOT NULL,
  `code` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_phone_verifications_user` (`username`),
  CONSTRAINT `fk_phone_verifications_user` FOREIGN KEY (`username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phone_verifications`
--

LOCK TABLES `phone_verifications` WRITE;
/*!40000 ALTER TABLE `phone_verifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `phone_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `points_account`
--

DROP TABLE IF EXISTS `points_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `points_account` (
  `user_username` varchar(100) NOT NULL,
  `balance` int NOT NULL,
  `lifetime_earned` int NOT NULL,
  `lifetime_spent` int NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_username` (`user_username`),
  CONSTRAINT `points_account_ibfk_1` FOREIGN KEY (`user_username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `points_account`
--

LOCK TABLES `points_account` WRITE;
/*!40000 ALTER TABLE `points_account` DISABLE KEYS */;
INSERT INTO `points_account` VALUES ('3221316102',80,80,0,'2026-01-18 22:52:00',1),('3221316103',50,50,0,'2026-01-18 22:52:00',2),('3221316107',10000,10000,0,'2026-01-29 13:26:28',3);
/*!40000 ALTER TABLE `points_account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `points_ledger`
--

DROP TABLE IF EXISTS `points_ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `points_ledger` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_username` varchar(100) NOT NULL,
  `delta` int NOT NULL,
  `reason_code` varchar(100) NOT NULL,
  `ref_type` varchar(50) DEFAULT NULL,
  `ref_id` varchar(100) DEFAULT NULL,
  `idempotency_key` varchar(255) NOT NULL,
  `meta` json DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idempotency_key` (`idempotency_key`),
  KEY `user_username` (`user_username`),
  CONSTRAINT `points_ledger_ibfk_1` FOREIGN KEY (`user_username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `points_ledger`
--

LOCK TABLES `points_ledger` WRITE;
/*!40000 ALTER TABLE `points_ledger` DISABLE KEYS */;
INSERT INTO `points_ledger` VALUES (1,'3221316102',50,'signup.bonus','signup','3221316102','3221316102|signup.bonus','null','2026-01-18 07:21:36'),(2,'3221316103',50,'signup.bonus','signup','3221316103','3221316103|signup.bonus','null','2026-01-18 14:52:01'),(3,'3221316102',30,'invite.reward','invite','3221316103','3221316102|invite.reward|3221316103','{\"invitee\": \"3221316103\"}','2026-01-18 14:52:01'),(4,'3221316107',10000,'admin.adjust','admin','3221316107','admin.adjust|3221316107|10000|奖励','{\"note\": \"奖励\"}','2026-01-29 05:26:29');
/*!40000 ALTER TABLE `points_ledger` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `role` varchar(50) NOT NULL DEFAULT 'user',
  `is_active` tinyint(1) DEFAULT '1',
  `must_change_password` tinyint(1) DEFAULT '0',
  `must_change_password_expires_at` datetime DEFAULT NULL,
  `grade` varchar(20) DEFAULT NULL,
  `subject` varchar(20) DEFAULT NULL,
  `teacher_id` varchar(50) DEFAULT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `phone_verified_at` datetime DEFAULT NULL,
  `wechat_openid` varchar(64) DEFAULT NULL,
  `wechat_unionid` varchar(64) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('3221316101','pbkdf2:sha256:1000000$eDFCQ7fAQuGoK095$975081dbb879fe2562f4301353a886a62aac14e7cb1f2df2f18c30c4a43ef527','2026-01-16 23:53:16','admin',1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),('3221316102','pbkdf2:sha256:1000000$pI0zefHj42anCzd4$eb39f3dc028b5668b2c4722d3f9fd959378e411f2a7d74a79a744324564d7e1b','2026-01-17 23:21:36','user',1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),('3221316103','pbkdf2:sha256:1000000$NIn5Ho6LS2E70naH$9151cff39598368e723fdbc5904790dc7fad5239b404485de231481372b73986','2026-01-18 06:52:01','user',1,0,NULL,NULL,'英语',NULL,NULL,NULL,NULL,NULL,NULL),('3221316107','pbkdf2:sha256:1000000$VBm1vfNZ9mS0O6Ua$ea9f7d18f5375147afe4b9e18b2702c58a724efd34ec15eeb5b4252720a1d116','2026-01-16 23:16:44','user',1,0,NULL,NULL,'语文',NULL,NULL,NULL,NULL,NULL,NULL),('3221316111','pbkdf2:sha256:1000000$KV9PLTReA0Yt0l99$c7b48697af47d435dec0064846c216a773fb36e54e94b0189b6d9863fc5380d1','2026-01-16 23:17:33','teacher',1,0,NULL,NULL,'语文',NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'essay_scoring'
--

--
-- Dumping routines for database 'essay_scoring'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-29 14:27:07
