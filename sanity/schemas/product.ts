import { defineField, defineType } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "number",
      validation: (Rule) => Rule.required().min(0)
    }),
    defineField({
      name: "inStock",
      title: "In Stock",
      type: "boolean",
      initialValue: true
    }),
    defineField({
      name: "stock",
      title: "Stock (quantity)",
      type: "number",
      initialValue: 0,
      validation: (Rule) => Rule.required().min(0)
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text"
    }),
    defineField({
      name: "details",
      title: "Details",
      type: "array",
      of: [{ type: "string" }]
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true }
        }
      ]
    })
  ],
  preview: {
    select: {
      title: "title",
      price: "price",
      media: "images.0"
    },
    prepare({ title, price, media }) {
      const subtitle = typeof price === "number" ? `€ ${price}` : undefined;
      return { title, subtitle, media };
    }
  }
});
