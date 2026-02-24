import { defineField, defineType } from "sanity";

export const order = defineType({
  name: "order",
  title: "Order",
  type: "document",
  fields: [
    defineField({
      name: "customerEmail",
      title: "Customer Email",
      type: "string",
      validation: (Rule) => Rule.required().email()
    }),
    defineField({
      name: "customerPhone",
      title: "Customer Phone",
      type: "string",
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: "total",
      title: "Total",
      type: "number",
      validation: (Rule) => Rule.required().min(0)
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Created", value: "created" },
          { title: "Paid", value: "paid" },
          { title: "Failed", value: "failed" }
        ]
      },
      initialValue: "created",
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      of: [{ type: "orderItem" }],
      validation: (Rule) => Rule.required().min(1)
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString()
    })
  ],
  preview: {
    select: {
      title: "customerEmail",
      total: "total",
      status: "status"
    },
    prepare({ title, total, status }) {
      const subtitleParts = [
        typeof total === "number" ? `€ ${total}` : null,
        status ? String(status) : null
      ].filter(Boolean);
      return {
        title: title ?? "Order",
        subtitle: subtitleParts.join(" · ")
      };
    }
  }
});
