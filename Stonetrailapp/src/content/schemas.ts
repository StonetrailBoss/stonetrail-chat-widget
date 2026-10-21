import { z } from 'zod';
export const schemas = {
  pages: {
    careers_our_workplace: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "subheading": z.string()
      }),
      "intro": z.object({
        "heading": z.string(),
        "body": z.string()
      }),
      "values": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "title": z.string(),
          "body": z.string()
        }))
      }),
      "perks": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "text": z.string()
        }))
      }),
      "cta": z.object({
        "heading": z.string(),
        "label": z.string()
      })
    }),
    careers_landing: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "subheading": z.string()
      }),
      "intro": z.object({
        "heading": z.string(),
        "body": z.string()
      }),
      "links": z.array(z.object({
        "id": z.string(),
        "label": z.string(),
        "description": z.string(),
        "href": z.string()
      })),
      "cta": z.object({
        "heading": z.string(),
        "body": z.string(),
        "label": z.string(),
        "email": z.string()
      })
    }),
    staff_reviews: z.object({
      "agentTitle": z.string(),
      "agentSubtitle": z.string(),
      "welcomeMessage": z.string(),
      "clearedMessage": z.string(),
      "inputPlaceholder": z.string(),
      "quickActions": z.array(z.object({
        "id": z.string(),
        "label": z.string(),
        "prompt": z.string()
      }))
    }),
    home: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "subheading": z.string(),
        "ctaExplore": z.string(),
        "ctaBook": z.string()
      }),
      "about": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "body1": z.string(),
        "body2": z.string(),
        "cta": z.string()
      }),
      "villas": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "cta": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "name": z.string(),
          "tagline": z.string(),
          "rate": z.string(),
          "guests": z.string(),
          "image": z.string(),
          "href": z.string()
        }))
      }),
      "experiences": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "body": z.string(),
        "cta": z.string()
      }),
      "promises": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "num": z.string(),
          "title": z.string(),
          "desc": z.string()
        }))
      }),
      "bookDirect": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "body": z.string(),
        "benefits": z.array(z.object({
          "id": z.string(),
          "text": z.string()
        })),
        "cta": z.string()
      }),
      "neighbourhood": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "body": z.string()
      }),
      "finalCta": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "cta": z.string()
      }),
      "promo": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "footer": z.string(),
        "footerCta": z.string()
      })
    }),
    about: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "story": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "paragraphs": z.array(z.object({
          "id": z.string(),
          "text": z.string()
        }))
      }),
      "values": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "num": z.string(),
          "title": z.string(),
          "desc": z.string()
        }))
      }),
      "quote": z.object({
        "eyebrow": z.string(),
        "text": z.string()
      }),
      "cta": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "primaryLabel": z.string(),
        "secondaryLabel": z.string()
      })
    }),
    contact: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "subheading": z.string()
      }),
      "info": z.object({
        "body": z.string(),
        "followLabel": z.string()
      }),
      "form": z.object({
        "successHeading": z.string(),
        "successBody": z.string(),
        "submitLabel": z.string()
      })
    }),
    policies: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "footer": z.object({
        "lastUpdated": z.string()
      }),
      "sections": z.array(z.object({
        "id": z.string(),
        "num": z.string(),
        "title": z.string(),
        "content": z.array(z.object({
          "id": z.string(),
          "heading": z.string(),
          "text": z.string()
        }))
      }))
    }),
    rooms: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "subheading": z.string()
      }),
      "intro": z.object({
        "body": z.string()
      }),
      "amenities": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "cta": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "primaryLabel": z.string(),
        "secondaryLabel": z.string()
      })
    }),
    reservations: z.object({
      "note": z.object({
        "policyText": z.string(),
        "policyLinkLabel": z.string(),
        "questionsText": z.string(),
        "questionsLinkLabel": z.string()
      })
    }),
    superior_villa: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "tagline": z.string()
      }),
      "overview": z.object({
        "eyebrow": z.string(),
        "body1": z.string(),
        "body2": z.string()
      }),
      "gallery": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "amenities": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "cta": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "primaryLabel": z.string(),
        "secondaryLabel": z.string()
      })
    }),
    honeymoon_suite: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "tagline": z.string()
      }),
      "overview": z.object({
        "eyebrow": z.string(),
        "body1": z.string(),
        "body2": z.string()
      }),
      "gallery": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "amenities": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "cta": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "primaryLabel": z.string(),
        "secondaryLabel": z.string()
      })
    }),
    garden_family_villa: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "tagline": z.string()
      }),
      "overview": z.object({
        "eyebrow": z.string(),
        "body1": z.string(),
        "body2": z.string()
      }),
      "gallery": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "amenities": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "cta": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "primaryLabel": z.string(),
        "secondaryLabel": z.string()
      })
    }),
    garden_junior_suite: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "tagline": z.string()
      }),
      "overview": z.object({
        "eyebrow": z.string(),
        "body1": z.string(),
        "body2": z.string()
      }),
      "gallery": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "amenities": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "cta": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "primaryLabel": z.string(),
        "secondaryLabel": z.string()
      })
    }),
    garden_retreat: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "tagline": z.string()
      }),
      "overview": z.object({
        "eyebrow": z.string(),
        "body1": z.string(),
        "body2": z.string()
      }),
      "gallery": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "amenities": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "cta": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "primaryLabel": z.string(),
        "secondaryLabel": z.string()
      })
    }),
    presidential_suite: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "tagline": z.string()
      }),
      "overview": z.object({
        "eyebrow": z.string(),
        "body1": z.string(),
        "body2": z.string()
      }),
      "gallery": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "amenities": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "cta": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "primaryLabel": z.string(),
        "secondaryLabel": z.string()
      })
    }),
    deluxe_king: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "tagline": z.string()
      }),
      "overview": z.object({
        "eyebrow": z.string(),
        "body1": z.string(),
        "body2": z.string()
      }),
      "gallery": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "amenities": z.object({
        "eyebrow": z.string(),
        "heading": z.string()
      }),
      "cta": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "primaryLabel": z.string(),
        "secondaryLabel": z.string()
      })
    }),
    blog_index: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "subheading": z.string()
      }),
      "empty": z.object({
        "text": z.string()
      })
    }),
    blog_post: z.object({
      "nav": z.object({
        "backLabel": z.string(),
        "backFooterLabel": z.string()
      }),
      "related": z.object({
        "eyebrow": z.string()
      })
    })
  }
};
export type Schemas = typeof schemas;