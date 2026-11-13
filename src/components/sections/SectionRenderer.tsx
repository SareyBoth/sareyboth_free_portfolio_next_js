import React from "react";
import type { PortfolioConfig } from "@/types/portfolio";
import { getRenderedSections } from "@/lib/content/selectors";
import { AboutSection } from "./AboutSection";
import { AchievementsSection } from "./AchievementsSection";
import { ContactSection } from "./ContactSection";
import { GallerySection } from "./GallerySection";
import { HeroSection } from "./HeroSection";
import { HighlightsSection } from "./HighlightsSection";
import { InterestsSection } from "./InterestsSection";
import { JournalSection } from "./JournalSection";
import { JourneySection } from "./JourneySection";
import { ResumeSection } from "./ResumeSection";
import { ServicesSection } from "./ServicesSection";
import { StrengthsSection } from "./StrengthsSection";
import { TestimonialsSection } from "./TestimonialsSection";

export function SectionRenderer({
  config,
  resumeAssetExists = true,
  isPreview = false,
}: {
  config: PortfolioConfig;
  resumeAssetExists?: boolean;
  isPreview?: boolean;
}) {
  const renderedSections = getRenderedSections(config, { resumeAssetExists });

  return (
    <div>
      {renderedSections.map((section) => {
        switch (section.id) {
          case "home":
            return (
              <HeroSection
                key={section.id}
                section={section}
                config={config}
                resumeAssetExists={resumeAssetExists}
                isPreview={isPreview}
              />
            );
          case "about":
            return (
              <AboutSection
                key={section.id}
                section={section}
                config={config}
              />
            );
          case "strengths":
            return (
              <StrengthsSection
                key={section.id}
                section={section}
                config={config}
              />
            );
          case "highlights":
            return (
              <HighlightsSection
                key={section.id}
                section={section}
                config={config}
                isPreview={isPreview}
              />
            );
          case "journey":
            return (
              <JourneySection
                key={section.id}
                section={section}
                config={config}
              />
            );
          case "achievements":
            return (
              <AchievementsSection
                key={section.id}
                section={section}
                config={config}
                isPreview={isPreview}
              />
            );
          case "testimonials":
            return (
              <TestimonialsSection
                key={section.id}
                section={section}
                config={config}
              />
            );
          case "services":
            return (
              <ServicesSection
                key={section.id}
                section={section}
                config={config}
              />
            );
          case "journal":
            return (
              <JournalSection
                key={section.id}
                section={section}
                config={config}
                isPreview={isPreview}
              />
            );
          case "interests":
            return (
              <InterestsSection
                key={section.id}
                section={section}
                config={config}
              />
            );
          case "gallery":
            return (
              <GallerySection
                key={section.id}
                section={section}
                config={config}
              />
            );
          case "resume":
            return (
              <ResumeSection
                key={section.id}
                section={section}
                config={config}
                resumeAssetExists={resumeAssetExists}
              />
            );
          case "contact":
            return (
              <ContactSection
                key={section.id}
                section={section}
                config={config}
                isPreview={isPreview}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
