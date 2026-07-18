# ComponentConwayDisplay

Conway's Game of Life。纯 PIXI UI + 可调网格/速度。

## 功能

- 随机 / 清除 / 单步 / 播放 / 暂停
- 可调行列数、cell 大小、播放速度（stepper）
- 2400 cells 单 Graphics 批量渲染
- Graphics v8 `fill-first` 踩坑修复（先 path 后 fill）
- 全部 PIXI UI（stepper / slider / button），无 React DOM
