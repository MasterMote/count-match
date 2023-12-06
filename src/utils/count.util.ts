import { arith } from "./float-arith.util";

export type GoodsObject = {
  index: number;
  name?: string;
  weight: number;
};

export type ResultObject = {
  indexStr: string;
  weightStr: string;
};

/**
 * 接受一组数据，将其中的多个对象中（多个对象数量为定值，例如要么全是4，要么全是其他任意值）的某个相同数据维度求和为一个固定值，例如将100个物品中，4个重量求和为20kg的物品配对找出
 * @param  rawData - 数据源
 * @param  objectNumber - 每次求和的对象数量 默认为4
 * @param  totalNumber - 求和后的总数 默认为20
 * @param  deviationValue - 平均数值的偏差值 0或不填不过滤偏差值
 * @param  accuracy - 小数点精度 默认2位小数
 * @returns 对象数组。
 */
export function findCountMate(
  rawData: Array<GoodsObject> = [],
  objectNumber: number = 4,
  totalNumber: number = 20,
  deviationValue?: number,
  accuracy: number = 2
): Promise<Array<ResultObject>> {
  return new Promise((resolve, reject) => {
    const resultList: ResultObject[] = [];
    function match(
      rawData: Array<GoodsObject> = [],
      objectNumber: number = 4,
      totalNumber: number = 20
    ): { list: Array<GoodsObject>; result: ResultObject } | null {
      let stopReduce: boolean = false;
      let matchResult: {
        list: Array<GoodsObject>;
        result: ResultObject;
      } | null = null;

      // floor当前递归层数 lastIndex上一层遍历到的最新下标 indexList所有下标
      function reduceMatch(
        floor: number = 0,
        lastIndex: number = 0,
        indexList: number[] = []
      ) {
        for (
          let i = lastIndex;
          i < rawData.length - (objectNumber - floor - 1);
          i++
        ) {
          if (stopReduce) return;
          indexList[floor] = i; // 记录每层遍历下标
          // 最终遍历层
          if (floor + 1 === objectNumber) {
            let totalCount: number = 0;
            const rawDataIndexList: number[] = [];
            const weightList: number[] = [];
            indexList.map((item) => {
              totalCount += Number(rawData[item].weight); // 求和
              rawDataIndexList.push(rawData[item].index); // 获取原数据index下标集合
              weightList.push(rawData[item].weight); // 获取重量集合
            });
            if (
              arith.toFixed(totalCount, accuracy) ===
              arith.toFixed(totalNumber, accuracy)
            ) {
              const filterList = rawData.filter(
                (item) => !rawDataIndexList.includes(item.index)
              );
              stopReduce = true;
              matchResult = {
                list: filterList,
                result: {
                  indexStr: rawDataIndexList.join(","),
                  weightStr: weightList.join(","),
                },
              };
            }
          }
          if (floor + 1 < objectNumber)
            reduceMatch(floor + 1, i + 1, indexList); // 递归层数不能超过目标数
        }
      }

      if (rawData.length > 0 && objectNumber) {
        try {
          reduceMatch();
        } catch (error) {
          console.log("error: ", error);
          reject(error);
        }

        return matchResult;
      }

      return null;
    }
    function find(data: Array<GoodsObject>) {
      const { list, result } = match(data, objectNumber, totalNumber) ?? {};
      if (list) {
        if (result) resultList.push(result);
        find(list);
      }
    }

    const averageValue = arith.toFixed(totalNumber / objectNumber, accuracy);
    if (deviationValue) {
      find(
        rawData.filter(
          (item) =>
            averageValue - deviationValue <= item.weight &&
            item.weight <= averageValue + deviationValue
        )
      );
    } else {
      find(rawData);
    }

    resolve(resultList);
  });
}
