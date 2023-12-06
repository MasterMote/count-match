<template>
  <div class="m-match-container">
    <div class="m-form-container">
      <a-form :model="formState" layout="inline" name="m-form">
        <a-form-item label="求和个体数">
          <a-input-number
            min="0"
            :precision="0"
            v-model:value="formState.objectNumber"
          />
        </a-form-item>
        <a-form-item label="求和总值">
          <a-input-number min="0" v-model:value="formState.total" />
        </a-form-item>
        <a-form-item label="偏差值">
          <a-input-number min="0" v-model:value="formState.deviationValue" />
        </a-form-item>
        <a-form-item label="小数位精度">
          <a-input-number
            min="0"
            :precision="0"
            v-model:value="formState.accuracy"
          />
        </a-form-item>
      </a-form>
      <div class="m-message">当前单体平均值：{{ avgValue }}</div>
    </div>
    <div class="m-count-container">
      <Button
        type="primary"
        class="m-count-btn"
        :disabled="disabled"
        @click="importData"
        >导入</Button
      >
      <Button
        type="primary"
        class="m-count-btn"
        :disabled="disabled"
        @click="find"
        >自动匹配</Button
      >
    </div>
    <div class="m-list-container">
      <Table :dataSource="dataSource" :columns="columns1"></Table>
    </div>
    <div class="m-list-container">
      <Table :dataSource="dataAfterMatch" :columns="columns2"></Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { Button, Table, message } from "ant-design-vue";
import { findCountMate } from "../utils/count.util";
import { arith } from "../utils/float-arith.util";
import { list } from "../assets/test";
import type { GoodsObject, ResultObject } from "../utils/count.util";

const formState = reactive<{
  objectNumber: number;
  total: number;
  deviationValue: number;
  accuracy: number;
}>({
  objectNumber: 4,
  total: 20,
  deviationValue: 0,
  accuracy: 2,
});
const dataSource = ref<GoodsObject[]>([]);
const dataAfterMatch = ref<ResultObject[]>([]);
const disabled = ref<boolean>(false);
const avgValue = computed(() =>
  arith.toFixed(
    (formState.total ?? 0) / (formState.objectNumber ?? 0),
    formState.accuracy ?? 2
  )
);
const columns1 = [
  {
    title: "编号",
    dataIndex: "index",
    key: "index",
  },
  {
    title: "名称",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "重量",
    dataIndex: "weight",
    key: "weight",
  },
];
const columns2 = [
  {
    title: "匹配编号",
    dataIndex: "indexStr",
    key: "indexStr",
  },
  {
    title: "匹配重量",
    dataIndex: "weightStr",
    key: "weightStr",
  },
];
function importData() {
  dataSource.value = list;
}
function find() {
  dataAfterMatch.value = [];
  disabled.value = true;
  message.info("匹配中，请稍后...");

  setTimeout(async () => {
    dataAfterMatch.value = await findCountMate(
      list,
      formState.objectNumber,
      formState.total,
      formState.deviationValue,
      formState.accuracy
    );
    if (dataAfterMatch.value.length === 0) {
      message.warning("未匹配到任意满足条件集合，请检查数据或调整匹配参数！");
    } else {
      message.success("匹配完成！");
    }
    disabled.value = false;
  }, 500);
}
</script>

<style>
.m-match-container {
  margin: 20px;
}
.m-form-container {
  padding: 10px;
  border: 1px solid #ebeaec;
}
.m-count-container {
  padding: 10px 0;
}
.m-count-btn {
  margin-right: 4px;
}
.m-list-container {
  padding: 10px 0;
}
.ant-col.ant-form-item-label label {
  font-size: 14px;
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  color: #595959;
}
.m-message {
  margin-top: 20px;
}
</style>
