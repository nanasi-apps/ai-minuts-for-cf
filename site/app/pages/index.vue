<script setup lang="ts">
import Button from "@/app/components/general/Button.vue";
import Card from "@/app/components/general/Card.vue";

const { t } = useI18n();

const features = computed(() => [
	{
		title: t("features.items.transcription.title"),
		description: t("features.items.transcription.description"),
		icon: "🎙️",
	},
	{
		title: t("features.items.summary.title"),
		description: t("features.items.summary.description"),
		icon: "✨",
	},
	{
		title: t("features.items.tasks.title"),
		description: t("features.items.tasks.description"),
		icon: "✅",
	},
]);
</script>

<template>
      <!-- Hero Section -->
      <section class="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
        <div class="absolute inset-0 -z-10">
          <div class="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-mattya-300 dark:bg-mattya-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
          <div class="absolute top-0 left-0 -translate-y-12 -translate-x-12 w-96 h-96 bg-mattya-200 dark:bg-mattya-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div class="absolute -bottom-32 left-20 w-96 h-96 bg-mattya-400 dark:bg-mattya-700 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mattya-100 dark:bg-mattya-900/50 text-mattya-800 dark:text-mattya-200 text-xs font-medium mb-8 border border-mattya-200 dark:border-mattya-800">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-mattya-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-mattya-500"></span>
            </span>
            {{ $t('hero.badge') }}
          </div>
          
          <h1 class="text-5xl md:text-7xl font-bold tracking-tight text-stone-900 dark:text-white mb-8 leading-tight">
            {{ $t('hero.title.line1') }}<br class="hidden md:block" />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-mattya-600 to-mattya-800 dark:from-mattya-400 dark:to-mattya-200">{{ $t('hero.title.line2') }}</span>
          </h1>
          
          <p class="max-w-2xl mx-auto text-lg md:text-xl text-stone-600 dark:text-stone-400 mb-10 leading-relaxed">
            {{ $t('hero.subtitle.line1') }}<br />
            {{ $t('hero.subtitle.line2') }}<br class="hidden md:block" />
            {{ $t('hero.subtitle.line3') }}
          </p>
          
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="large" shadow>{{ $t('hero.cta.start') }}</Button>
            <Button variant="secondary" size="large">
              {{ $t('hero.cta.demo') }}
            </Button>
          </div>

          <!-- Hero Image / Dashboard Mockup -->
          <div class="mt-16 relative mx-auto max-w-5xl">
            <div class="rounded-2xl bg-white/40 dark:bg-stone-800/40 backdrop-blur-sm p-2 ring-1 ring-black/5 dark:ring-white/10 shadow-2xl">
              <div class="rounded-xl bg-white dark:bg-stone-900 aspect-[16/9] overflow-hidden flex items-center justify-center border border-stone-100 dark:border-stone-800">
                <div class="text-center p-8">
                  <div class="text-6xl mb-4">🤖📝</div>
                  <p class="text-stone-400 font-medium">{{ $t('hero.mockup.alt') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="py-24 bg-white dark:bg-stone-950 relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-16">
            <h2 class="text-3xl font-bold text-stone-900 dark:text-white mb-4">{{ $t('features.title') }}</h2>
            <p class="text-stone-600 dark:text-stone-400">
              {{ $t('features.description') }}
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <Card v-for="feature in features" :key="feature.title" class="hover:-translate-y-1 transition-transform duration-300 border border-stone-100 dark:border-stone-800 !bg-stone-50/50 dark:!bg-stone-900/50">
              <div class="h-12 w-12 rounded-xl bg-mattya-100 dark:bg-mattya-900/30 flex items-center justify-center text-2xl mb-6">
                {{ feature.icon }}
              </div>
              <h3 class="text-xl font-bold text-stone-900 dark:text-white mb-3">{{ feature.title }}</h3>
              <p class="text-stone-600 dark:text-stone-400 leading-relaxed">{{ feature.description }}</p>
            </Card>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-24 bg-mattya-900 dark:bg-stone-900 text-white relative overflow-hidden">
        <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div class="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 class="text-3xl md:text-5xl font-bold mb-6">{{ $t('cta.title.line1') }}<br />{{ $t('cta.title.line2') }}</h2>
          <p class="text-mattya-100 dark:text-stone-400 text-lg mb-10 max-w-2xl mx-auto">
            {{ $t('cta.description.line1') }}<br />
            {{ $t('cta.description.line2') }}
          </p>
          <Button variant="white">{{ $t('cta.button') }}</Button>
        </div>
      </section>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}
</style>