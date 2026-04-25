'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { GraduationCap, Bot, Target, BookOpen, Sparkles, Video, Award, CheckCircle, Users } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const features = [
    {
      id: 'assistant',
      title: 'Asistente Inteligente',
      description: 'Reconocimiento en tiempo real de Lengua de Señas Colombiana para apoyo en clase',
      icon: Bot,
      gradient: 'from-blue-500 to-blue-600',
      badge: 'Módulo Principal',
      highlights: ['Reconocimiento en vivo', 'Retroalimentación instantánea', 'Historial de señas'],
      href: '/asistente',
    },
    {
      id: 'practice',
      title: 'Práctica Gamificada',
      description: 'Sistema de puntos, rachas diarias y ejercicios progresivos para mejorar habilidades',
      icon: Target,
      gradient: 'from-orange-500 to-orange-600',
      badge: 'Popular',
      highlights: ['Sistema de puntos', 'Racha de días', 'Logros desbloqueables'],
      href: '/practica',
    },
    {
      id: 'dictionary',
      title: 'Diccionario Visual',
      description: 'Catálogo completo de señas organizadas por categorías con videos demostrativos',
      icon: BookOpen,
      gradient: 'from-green-500 to-green-600',
      badge: 'Complementario',
      highlights: ['Búsqueda avanzada', 'Categorización', 'Videos HD'],
      href: '/diccionario',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-orange-200/30 to-pink-200/30 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-green-200/20 to-blue-200/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full mb-8 shadow-md border border-gray-200">
              <GraduationCap size={20} className="text-primary-600" />
              <span className="text-sm font-semibold text-gray-900">
                Universidad de Nariño - Diseño Gráfico
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Aprende Lengua de Señas Colombiana
              <br />
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                con Inteligencia Artificial
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Plataforma educativa de reconocimiento en tiempo real diseñada para facilitar
              el aprendizaje de LSC. Demo institucional para la materia Expresión.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/asistente">
                <Button variant="primary" size="lg" rightIcon={<Bot size={22} />} className="w-full sm:w-auto">
                  Probar Asistente
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto border border-gray-300"
              >
                Ver Características
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16"
          >
            <div className="relative mx-auto max-w-4xl">
              <div className="aspect-video bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl shadow-2xl overflow-hidden border-8 border-white">
                <div className="w-full h-full flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20" />
                  <div className="relative z-10 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                      <span className="text-5xl">🤟</span>
                    </div>
                    <p className="text-xl font-semibold text-primary-700">Demo Interactivo</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
              Módulos principales
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tres formas de aprender LSC
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Cada módulo está diseñado para ofrecer una experiencia de aprendizaje única y complementaria
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link href={feature.href}>
                    <div className="card card-hoverable h-full group p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                          <Icon size={32} className="text-white" />
                        </div>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {feature.badge}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>

                      <ul className="space-y-3 mb-6">
                        {feature.highlights.map((highlight, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                            {highlight}
                          </li>
                        ))}
                      </ul>

                      <Button variant="ghost" className="w-full border border-gray-200">
                        Explorar módulo
                      </Button>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🤟</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg">LSC Recognition</h3>
              <p className="text-xs text-gray-400">Demo Institucional</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            © 2026 LSC Recognition. Desarrollado como proyecto académico para la Universidad de Nariño.
          </p>
        </div>
      </footer>
    </div>
  );
}
