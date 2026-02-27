# 这里是后端

使用ECS的

开放单个websocket口进行通信.

# usage
`uvicorn main:app --reload`
如果没有在server这个文件夹运行，会失败。



`15/16	3/8	(max - (max >> 4)) + (min >> 2) + (min >> 3)	5.5%	Very smooth, very low average error.`

在其中，只，实现，移动的，部分？如何？
一个object确实是
{
  health: int,
  x: int,
  y: int,
  vx: int,
  vy: int,
  moving_system: id,
}

# 鼠鼠乐园 ～ a project for simulation game

**note**: 学习部分挪到了io里面，能展示。计划暂且不示人

in general, this project will be a simulation game like Rimworld or other 4X games.

here is the plan of this game.

## frameworks

in this section, the frontend and backend frame will be introduced.

### frontend

maybe [phaser](https://blog.logrocket.com/best-javascript-html5-game-engines/)

more infomation about phaser see [here](/phaser.md)

### backend

not really sure but maybe in java or python (maybe some thing about machine learning)

or this example

upload:

client -- browser -- api(golang?) -- redis/kafka -- python/java -- database

download:

client -- browser -- api(golang?) -- database
~~NOTE: maybe no orm~~ no need for multi-language orm now.

it seems that sqlite is ok for it?
NOTE: maybe add redis

so maybe you should learn kafka and how to deal with it with python golang or else.

NOTE: 想起来了上传特别弱。。.
NOTE: how to deal with edge of two simulator.

### entities

catagories.

- map
  - this is the ground entity that shows up and exists in the background.
  - it accutary the memo of ground truth.
- pawns
  - this is 
  - pawns has property.
  - it has little **mem** to store some key infomation. it has **inventory** to store some **items** in game
  - every time, pawns ues it's **sensers** to get the ground that it knwon.
  - it generate **ambitious** or **aims**
  - when pawn has an **aim**, it cause the pawn **move**
  - the pawn get a **move**
  - then with the time slips. pawn 
- items
  - this is the item 



## gameplay

大概是游戏机制

### 开场

掉下来了一块银河系漫游指南的石头，鼠鼠们被激励了，开始了科学发展

### 机制

~~完了脑子射出去了~~

#### 棋盘

32 x 32 = 1024为一格子，正方形，无限铺张。
一次加载至少九个格子，也许更多
格子包含的内容
- 当前地的海拔高度
- 当前地的土壤情况
- 当前地的地块类型（屋顶下，岩石顶下）
- 当前地的地板类型
- 当前地上的建筑物，植物，或者岩石掩体
- 温度
- 是否室内
- 美观度



以1024B = 1KB的blob格式储存
可能2KB

#### 鼠鼠

鼠鼠是智能体
*吵死了又是枪声又是痨病鬼的。*

#### 货币

待定


