﻿
// Copyright © 2015-2017 Alex Kukhtin. All rights reserved.

using System;
using A2v10.Infrastructure;

namespace A2v10.Xaml
{
	public class DropDownMegaMenu : Container
	{
		public DropDownDirection Direction { get; set; }

		public String GroupBy { get; set; }
		public Int32 Columns { get; set; }
		public Length Width { get; set; }

		internal override void RenderElement(RenderContext context, Action<TagBuilder> onRender = null)
		{
			var menu = new TagBuilder("mega-menu");
			MergeAttributes(menu, context);
			if (Direction != DropDownDirection.DownLeft)
				menu.AddCssClass(Direction.ToString().ToKebabCase());
			var itms = GetBinding(nameof(ItemsSource));
			if (itms == null)
				throw new XamlException("DropDownMegaMenu. ItemsSource binging must be specified");

			menu.MergeAttribute(":items-source", itms.GetPath(context));
			menu.MergeAttribute("group-by", GroupBy);
			menu.MergeAttribute(":columns", Columns.ToString());
			if (Width != null)
				menu.MergeAttribute("width", Width.Value);

			menu.RenderStart(context);

			if (Children.Count != 1)
				throw new XamlException("DropDownMegaMenu. MenuItem must be specified");
			var mi = Children[0] as MenuItem;
			if (mi == null)
				throw new XamlException("DropDownMegaMenu. MenuItem must be specified");

			var tml = new TagBuilder("template");
			tml.MergeAttribute("slot", "item");
			tml.MergeAttribute("slot-scope", "slotItem");
			tml.RenderStart(context);
			using (new ScopeContext(context, "slotItem.menuItem"))
			{
				mi.RenderElement(context);
			}
			tml.RenderEnd(context);
			menu.RenderEnd(context);
		}
	}
}
