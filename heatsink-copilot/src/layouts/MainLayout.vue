<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>Heatsink Copilot</q-toolbar-title>
        <q-btn flat to="/" label="Home" />
        <q-btn flat to="/wizard" label="Wizard" />
        <q-btn flat to="/results" label="Results" />
        <OfflineIndicator class="q-ml-md" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import OfflineIndicator from "src/components/OfflineIndicator.vue";
</script>
