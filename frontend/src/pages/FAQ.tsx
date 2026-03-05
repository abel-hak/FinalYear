import React from 'react';
import { motion } from 'framer-motion';
import { 
  HelpCircle, 
  ChevronDown, 
  MessageCircle, 
  Book, 
  Gamepad2, 
  Trophy, 
  Code2, 
  Lightbulb,
  Mail,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Mascot from '@/components/Mascot';

interface FAQCategory {
  title: string;
  icon: React.ReactNode;
  questions: {
    question: string;
    answer: string;
  }[];
}

const faqCategories: FAQCategory[] = [
  {
    title: 'Getting Started',
    icon: <Gamepad2 className="w-5 h-5" />,
    questions: [
      {
        question: 'What is CodeQuest?',
        answer: 'CodeQuest is a gamified learning platform where you learn programming by debugging broken code. Instead of just reading tutorials, you get hands-on practice fixing real bugs and earning XP as you progress.'
      },
      {
        question: 'Do I need programming experience to start?',
        answer: 'Not at all! We have quests for all skill levels, starting from complete beginners. Our progressive hint system and concept explanations will guide you through each challenge.'
      },
      {
        question: 'What programming languages are supported?',
        answer: 'We currently focus on Python, which is perfect for beginners and widely used in professional settings. More languages are coming soon!'
      }
    ]
  },
  {
    title: 'Quests & Challenges',
    icon: <Code2 className="w-5 h-5" />,
    questions: [
      {
        question: 'How do quests work?',
        answer: 'Each quest presents you with broken code and an error message. Your job is to identify the bug and fix it. You can use hints if you get stuck, but using fewer hints earns you more XP!'
      },
      {
        question: 'What happens if I get stuck?',
        answer: 'No worries! Every quest has progressive hints that gradually reveal more information. You can also view concept explanations to learn the underlying programming concepts.'
      },
      {
        question: 'Can I retry a quest?',
        answer: 'Absolutely! You can retry any quest as many times as you want. Your best score is saved, so keep practicing to improve!'
      },
      {
        question: 'Is there a time limit?',
        answer: 'Some quests have optional time challenges for bonus XP. You\'ll see a timer and get warnings as time runs low. Don\'t worry - you can always complete the quest without the time bonus.'
      }
    ]
  },
  {
    title: 'XP & Achievements',
    icon: <Trophy className="w-5 h-5" />,
    questions: [
      {
        question: 'How do I earn XP?',
        answer: 'You earn XP by completing quests. The amount depends on the quest difficulty, how many hints you used, and whether you finished within the time limit.'
      },
      {
        question: 'What are achievements?',
        answer: 'Achievements are special badges you earn for reaching milestones, like completing your first quest, finishing 10 quests without hints, or mastering a specific concept.'
      },
      {
        question: 'What do levels unlock?',
        answer: 'As you level up, you unlock harder quests, new categories, and special achievements. Higher levels also unlock cosmetic rewards for your profile!'
      }
    ]
  },
  {
    title: 'Hints & Learning',
    icon: <Lightbulb className="w-5 h-5" />,
    questions: [
      {
        question: 'How do hints work?',
        answer: 'Each quest has 3 levels of hints. The first hint is general, the second gives more specific guidance, and the third points directly to the solution. Using hints reduces your XP reward.'
      },
      {
        question: 'What are Knowledge Scrolls?',
        answer: 'Knowledge Scrolls are detailed concept explanations that help you understand the programming concepts behind each bug. They include examples, best practices, and related concepts.'
      },
      {
        question: 'Will using hints affect my progress?',
        answer: 'Using hints reduces the XP you earn for that quest, but you can always retry to earn full points. Learning is more important than scores!'
      }
    ]
  }
];

const FAQ: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header userXP={1250} userLevel={5} xpToNextLevel={750} />

      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Mascot mood="happy" message="Need help? I got you! 🤓" size="lg" />
            </div>
            <Badge variant="glass" className="mb-4">
              <HelpCircle className="w-4 h-4 mr-2" />
              Help Center
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Frequently Asked{' '}
              <span className="gradient-text">Questions</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about CodeQuest. Can't find what you're looking for? 
              Reach out to our support team!
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-12">
        <div className="container max-w-4xl">
          <div className="space-y-8">
            {faqCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                {/* Category Header */}
                <div className="px-6 py-4 bg-secondary/30 border-b border-border flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 text-primary">
                    {category.icon}
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {category.title}
                  </h2>
                </div>

                {/* Questions */}
                <Accordion type="single" collapsible className="px-6">
                  {category.questions.map((item, index) => (
                    <AccordionItem key={index} value={`${categoryIndex}-${index}`}>
                      <AccordionTrigger className="text-left hover:text-primary transition-colors">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-3xl p-8 text-center"
          >
            <div className="flex justify-center mb-4">
              <Mascot mood="encouraging" message="I'm here to help! 💬" size="md" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Still have questions?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Can't find the answer you're looking for? Our support team is here to help you on your coding journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                Contact Support
              </Button>
              <Link to="/quests">
                <Button variant="glass" className="gap-2 w-full sm:w-auto">
                  <Book className="w-4 h-4" />
                  Browse Quests
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 border-t border-border">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/quests">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-card border border-border rounded-xl flex items-center gap-3 hover:border-primary/50 transition-colors"
              >
                <Gamepad2 className="w-5 h-5 text-primary" />
                <span className="font-medium">Start a Quest</span>
                <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
              </motion.div>
            </Link>
            <Link to="/achievements">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-card border border-border rounded-xl flex items-center gap-3 hover:border-primary/50 transition-colors"
              >
                <Trophy className="w-5 h-5 text-gold" />
                <span className="font-medium">View Achievements</span>
                <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
              </motion.div>
            </Link>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-card border border-border rounded-xl flex items-center gap-3 hover:border-primary/50 transition-colors cursor-pointer"
            >
              <Mail className="w-5 h-5 text-accent" />
              <span className="font-medium">Email Us</span>
              <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
