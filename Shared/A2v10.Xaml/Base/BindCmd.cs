﻿
using System;
using System.Reflection;
using System.Windows.Markup;

namespace A2v10.Xaml
{
    public enum CommandType
    {
        Unknown,
        Close,
        SaveAndClose,
        Reload,
        Refresh,
        Requery,
        Save,
        OpenSelected
    }

    public class BindCmd : BindBase
    {
        public CommandType Command { get; set; }
        public String Argument { get; set; }
        public String Action { get; set; }

        public BindCmd()
        {

        }
        public BindCmd(String command)
        {
            CommandType cmdType;
            if (!Enum.TryParse<CommandType>(command, out cmdType))
                throw new XamlException($"Invalid command '{command}'");
            Command = cmdType;
        }

        public String GetCommand()
        {
            switch (Command)
            {
                case CommandType.Unknown:
                    throw new NotImplementedException($"Command required for BindCmd extension");
                case CommandType.Refresh:
                case CommandType.Reload:
                    return "$reload()";
                case CommandType.Requery:
                    return "$requery()";
                case CommandType.Save:
                    return "$save()";
                case CommandType.Close:
                    return "$close()";
                case CommandType.SaveAndClose:
                    return "$saveAndClose()";
                case CommandType.OpenSelected:
                    if (String.IsNullOrEmpty(Action))
                        throw new NotImplementedException($"Action required for OpenSelected command");
                    if (String.IsNullOrEmpty(Argument))
                        throw new NotImplementedException($"Argument required for OpenSelected command");
                    return $"$open({{mode:'selected', action:'{Action}', arg:{Argument} }})";
                default:
                    throw new NotImplementedException($"command '{Command}' yet not implemented");
            }
        }

        internal void MergeCommandAttributes(TagBuilder tag)
        {
            switch (Command)
            {
                case CommandType.Save:
                case CommandType.SaveAndClose:
                    tag.MergeAttribute(":disabled", "$isPristine");
                    break;
            }
        }
    }
}
