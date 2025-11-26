<script setup lang="ts">
import { useAsyncApi } from "@/app/composable/useApi";

/**
 * ユーザー情報取得のサンプルコンポーネント
 * IDを指定してユーザー情報を取得するAPIの呼び出し例
 * 認証不要のエンドポイント
 */
const { data: userData } = await useAsyncApi((api) =>
	api.users.getUser({ id: 1 }),
);
</script>

<template>
  <Card>
    <p v-if="userData">{{ userData.name ?? "名前未設定" }}</p>
    <p v-else>ユーザーが見つかりません</p>
  </Card>
</template>

<style module>

</style>